use anyhow::Result;
use diesel::QueryDsl;
use std::sync::Arc;

use sui_indexer_alt_framework::{
    pipeline::{sequential::Handler, Processor},
    postgres::{Connection, Db},
    types::full_checkpoint_content::Checkpoint,
};
use sui_types::object::Object;

use depatreon_indexer::events::{
    parse_depatreon_event, DepatreonEvent,
};
use depatreon_indexer::models::{CreatorUpdatePatch, NewCreator, NewEventLog, NewPost, NewSubscription};
use depatreon_indexer::schema::{creators, events_log, posts, subscriptions};

/// Row types for the indexer batch — events_log + DePatreon entities + updates
#[derive(Clone)]
pub enum IndexerRow {
    EventLog(NewEventLog),
    Creator(NewCreator),
    CreatorSoftDelete { creator_address: String },
    CreatorUpdate {
        creator_address: String,
        name: Option<String>,
        description: Option<String>,
        avatar_blob_id: Option<String>,
        suins_name: Option<String>,
    },
    Post(NewPost),
    PostSoftDelete {
        service_object_id: String,
        post_id: i32,
    },
    Subscription(NewSubscription),
}

/// Indexes checkpoint transactions and DePatreon events.
pub struct EventLogHandler {
    package_prefix: String,
}

impl EventLogHandler {
    pub fn new() -> Self {
        let package_id = std::env::var("PACKAGE_ID").unwrap_or_else(|_| {
            std::env::var("NEXT_PUBLIC_PACKAGE_ID").unwrap_or_else(|_| {
                "0x778ecde37896bf33ce157208cbd90a3d7e42475de59875d66f9db34031258d12".to_string()
            })
        });
        let package_prefix = format!("{}::", package_id);
        Self { package_prefix }
    }

    fn service_type_suffix(&self) -> String {
        format!("{}::service::Service", self.package_prefix.trim_end_matches("::"))
    }

    fn find_service_object<'a>(
        &self,
        object_set: &'a sui_types::full_checkpoint_content::ObjectSet,
        tx: &sui_types::full_checkpoint_content::ExecutedTransaction,
    ) -> Option<&'a Object> {
        let suffix = "::service::Service";
        tx.output_objects(object_set)
            .find(|obj: &&Object| {
                obj.type_()
                    .map(|t| {
                        let s = format!("{}", t);
                        s.ends_with(suffix) && s.starts_with(&self.package_prefix)
                    })
                    .unwrap_or(false)
            })
    }

    fn find_service_in_inputs<'a>(
        &self,
        object_set: &'a sui_types::full_checkpoint_content::ObjectSet,
        tx: &sui_types::full_checkpoint_content::ExecutedTransaction,
    ) -> Option<&'a Object> {
        let suffix = "::service::Service";
        tx.input_objects(object_set)
            .find(|obj: &&Object| {
                obj.type_()
                    .map(|t| {
                        let s = format!("{}", t);
                        s.ends_with(suffix) && s.starts_with(&self.package_prefix)
                    })
                    .unwrap_or(false)
            })
    }
}

impl Default for EventLogHandler {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl Processor for EventLogHandler {
    const NAME: &'static str = "event_log_handler";

    type Value = IndexerRow;

    async fn process(&self, checkpoint: &Arc<Checkpoint>) -> Result<Vec<IndexerRow>> {
        let checkpoint_seq = checkpoint.summary.sequence_number as i64;
        let timestamp = chrono::Utc::now();
        let mut rows = Vec::new();

        for tx in &checkpoint.transactions {
            let tx_digest = tx.transaction.digest().to_string();

            rows.push(IndexerRow::EventLog(NewEventLog {
                event_type: "TransactionProcessed".to_string(),
                checkpoint: checkpoint_seq,
                tx_digest: tx_digest.clone(),
                data: serde_json::json!({
                    "tx_digest": tx_digest,
                    "checkpoint": checkpoint_seq,
                }),
                timestamp,
            }));

            if let Some(events) = &tx.events {
                for event in &events.data {
                    if let Some(parse_result) =
                        parse_depatreon_event(event, &self.package_prefix)
                    {
                        match parse_result {
                            Ok(DepatreonEvent::CreatorRegistered(ev)) => {
                                if let Some(service_obj) =
                                    self.find_service_object(&checkpoint.object_set, tx)
                                {
                                    rows.push(IndexerRow::Creator(NewCreator {
                                        service_object_id: service_obj.id().to_string(),
                                        creator_address: ev.creator.to_string(),
                                        name: ev.name.clone(),
                                        description: String::new(),
                                        avatar_blob_id: None,
                                        suins_name: None,
                                    }));
                                }
                            }
                            Ok(DepatreonEvent::CreatorDeleted(ev)) => {
                                rows.push(IndexerRow::CreatorSoftDelete {
                                    creator_address: ev.creator.to_string(),
                                });
                            }
                            Ok(DepatreonEvent::ProfileUpdated(ev)) => {
                                rows.push(IndexerRow::CreatorUpdate {
                                    creator_address: ev.creator.to_string(),
                                    name: Some(ev.name.clone()),
                                    description: None,
                                    avatar_blob_id: None,
                                    suins_name: None,
                                });
                            }
                            Ok(DepatreonEvent::PostPublished(ev)) => {
                                if let Some(service_obj) =
                                    self.find_service_object(&checkpoint.object_set, tx)
                                {
                                    let service_id = service_obj.id().to_string();
                                    if let Some(move_obj) = service_obj.data.try_as_move() {
                                        let contents: &[u8] = move_obj.contents();
                                        if let Some(post) = parse_last_post_from_service_bcs(
                                            contents,
                                            ev.post_id,
                                            ev.required_tier,
                                        ) {
                                            rows.push(IndexerRow::Post(NewPost {
                                                service_object_id: service_id.clone(),
                                                post_id: post.post_id,
                                                title: post.title,
                                                metadata_blob_id: Some(post.metadata_blob_id),
                                                data_blob_id: Some(post.data_blob_id),
                                                required_tier: post.required_tier,
                                                created_at_ms: post.created_at_ms,
                                            }));
                                        }
                                    }
                                }
                            }
                            Ok(DepatreonEvent::PostUpdated(ev)) => {
                                if let Some(service_obj) =
                                    self.find_service_object(&checkpoint.object_set, tx)
                                {
                                    let service_id = service_obj.id().to_string();
                                    if let Some(move_obj) = service_obj.data.try_as_move() {
                                        let contents: &[u8] = move_obj.contents();
                                        if let Some(post) = parse_post_by_id_from_service_bcs(
                                            contents,
                                            ev.post_id,
                                        ) {
                                            rows.push(IndexerRow::Post(NewPost {
                                                service_object_id: service_id,
                                                post_id: post.post_id,
                                                title: post.title,
                                                metadata_blob_id: Some(post.metadata_blob_id),
                                                data_blob_id: Some(post.data_blob_id),
                                                required_tier: post.required_tier,
                                                created_at_ms: post.created_at_ms,
                                            }));
                                        }
                                    }
                                }
                            }
                            Ok(DepatreonEvent::PostDeleted(ev)) => {
                                if let Some(service_obj) =
                                    self.find_service_object(&checkpoint.object_set, tx)
                                {
                                    rows.push(IndexerRow::PostSoftDelete {
                                        service_object_id: service_obj.id().to_string(),
                                        post_id: ev.post_id as i32,
                                    });
                                }
                            }
                            Ok(DepatreonEvent::SubscriptionPurchased(ev)) => {
                                if let Some(service_obj) =
                                    self.find_service_in_inputs(&checkpoint.object_set, tx)
                                {
                                    rows.push(IndexerRow::Subscription(NewSubscription {
                                        subscriber_address: ev.subscriber.to_string(),
                                        service_object_id: service_obj.id().to_string(),
                                        tier_level: ev.tier as i32,
                                        expires_at_ms: ev.expires_at_ms as i64,
                                    }));
                                }
                            }
                            Ok(DepatreonEvent::SubscriptionRenewed(ev)) => {
                                if let Some(service_obj) =
                                    self.find_service_in_inputs(&checkpoint.object_set, tx)
                                {
                                    rows.push(IndexerRow::Subscription(NewSubscription {
                                        subscriber_address: ev.subscriber.to_string(),
                                        service_object_id: service_obj.id().to_string(),
                                        tier_level: ev.tier as i32,
                                        expires_at_ms: ev.new_expires_at_ms as i64,
                                    }));
                                }
                            }
                            Ok(DepatreonEvent::SuinsNameLinked(ev)) => {
                                rows.push(IndexerRow::CreatorUpdate {
                                    creator_address: ev.creator.to_string(),
                                    name: None,
                                    description: None,
                                    avatar_blob_id: None,
                                    suins_name: Some(ev.suins_name.clone()),
                                });
                            }
                            Err(e) => {
                                tracing::warn!("Failed to parse DePatreon event: {}", e);
                            }
                        }
                    }
                }
            }
        }

        Ok(rows)
    }
}

struct ParsedPost {
    post_id: i32,
    title: String,
    metadata_blob_id: String,
    data_blob_id: String,
    required_tier: i32,
    created_at_ms: i64,
}

fn parse_last_post_from_service_bcs(
    contents: &[u8],
    post_id: u64,
    required_tier: u64,
) -> Option<ParsedPost> {
    let mut cursor = 0;
    let _id = read_object_id(contents, &mut cursor).ok()?;
    let _creator = read_address(contents, &mut cursor).ok()?;
    let _name = read_string(contents, &mut cursor).ok()?;
    let _description = read_string(contents, &mut cursor).ok()?;
    let _avatar = read_string(contents, &mut cursor).ok()?;
    let tiers_len = read_u64_leb128(contents, &mut cursor).ok()? as usize;
    for _ in 0..tiers_len {
        skip_tier(contents, &mut cursor)?;
    }
    let posts_len = read_u64_leb128(contents, &mut cursor).ok()? as usize;
    let mut last_post = None;
    for _ in 0..posts_len {
        if let Some(p) = read_post(contents, &mut cursor) {
            if p.post_id as u64 == post_id {
                last_post = Some(ParsedPost {
                    post_id: p.post_id,
                    title: p.title,
                    metadata_blob_id: p.metadata_blob_id,
                    data_blob_id: p.data_blob_id,
                    required_tier: p.required_tier,
                    created_at_ms: p.created_at_ms,
                });
            }
        }
    }
    last_post.map(|mut p| {
        p.required_tier = required_tier as i32;
        p
    })
}

fn parse_post_by_id_from_service_bcs(contents: &[u8], post_id: u64) -> Option<ParsedPost> {
    let mut cursor = 0;
    let _id = read_object_id(contents, &mut cursor).ok()?;
    let _creator = read_address(contents, &mut cursor).ok()?;
    let _name = read_string(contents, &mut cursor).ok()?;
    let _description = read_string(contents, &mut cursor).ok()?;
    let _avatar = read_string(contents, &mut cursor).ok()?;
    let tiers_len = read_u64_leb128(contents, &mut cursor).ok()? as usize;
    for _ in 0..tiers_len {
        skip_tier(contents, &mut cursor)?;
    }
    let posts_len = read_u64_leb128(contents, &mut cursor).ok()? as usize;
    for _ in 0..posts_len {
        if let Some(p) = read_post(contents, &mut cursor) {
            if p.post_id as u64 == post_id {
                return Some(p);
            }
        }
    }
    None
}

fn read_u64_leb128(bytes: &[u8], cursor: &mut usize) -> Result<u64, std::convert::Infallible> {
    let mut value: u64 = 0;
    let mut shift = 0;
    loop {
        let byte = bytes[*cursor];
        *cursor += 1;
        value |= ((byte & 0x7F) as u64) << shift;
        if byte & 0x80 == 0 {
            break;
        }
        shift += 7;
    }
    Ok(value)
}

fn read_address(bytes: &[u8], cursor: &mut usize) -> Result<sui_types::base_types::SuiAddress, std::convert::Infallible> {
    let addr = move_core_types::account_address::AccountAddress::from_bytes(&bytes[*cursor..*cursor + 32]).unwrap();
    *cursor += 32;
    Ok(sui_types::base_types::SuiAddress::from(addr))
}

fn read_string(bytes: &[u8], cursor: &mut usize) -> Result<String, std::convert::Infallible> {
    let len = read_u64_leb128(bytes, cursor).unwrap() as usize;
    let s = String::from_utf8(bytes[*cursor..*cursor + len].to_vec()).unwrap();
    *cursor += len;
    Ok(s)
}

fn read_object_id(bytes: &[u8], cursor: &mut usize) -> Result<sui_types::base_types::ObjectID, sui_types::base_types::ObjectIDParseError> {
    let id = sui_types::base_types::ObjectID::from_bytes(&bytes[*cursor..*cursor + 32])?;
    *cursor += 32;
    Ok(id)
}

fn skip_tier(bytes: &[u8], cursor: &mut usize) -> Option<()> {
    read_u64_leb128(bytes, cursor).ok()?;
    let name_len = read_u64_leb128(bytes, cursor).ok()? as usize;
    *cursor += name_len;
    read_u64_leb128(bytes, cursor).ok()?;
    read_u64_leb128(bytes, cursor).ok()?;
    Some(())
}

fn read_post(bytes: &[u8], cursor: &mut usize) -> Option<ParsedPost> {
    let post_id = read_u64_leb128(bytes, cursor).ok()? as i32;
    let title = read_string(bytes, cursor).ok()?;
    let metadata_blob_id = read_string(bytes, cursor).ok()?;
    let data_blob_id = read_string(bytes, cursor).ok()?;
    let required_tier = read_u64_leb128(bytes, cursor).ok()? as i32;
    let created_at_ms = read_u64_leb128(bytes, cursor).ok()? as i64;
    Some(ParsedPost {
        post_id,
        title,
        metadata_blob_id,
        data_blob_id,
        required_tier,
        created_at_ms,
    })
}

#[async_trait::async_trait]
impl Handler for EventLogHandler {
    type Store = Db;
    type Batch = Vec<IndexerRow>;

    fn batch(&self, batch: &mut Self::Batch, values: std::vec::IntoIter<IndexerRow>) {
        batch.extend(values);
    }

    async fn commit<'a>(&self, batch: &Self::Batch, conn: &mut Connection<'a>) -> Result<usize> {
        use diesel::prelude::*;
        use diesel_async::RunQueryDsl as AsyncExecute;
        let mut total = 0;

        let (event_logs, creators, creator_deletes, creator_updates, post_inserts, post_deletes, sub_upserts): (
            Vec<_>,
            Vec<_>,
            Vec<_>,
            Vec<_>,
            Vec<_>,
            Vec<_>,
            Vec<_>,
        ) = batch.iter().fold(
            (vec![], vec![], vec![], vec![], vec![], vec![], vec![]),
            |mut acc, row| {
                match row {
                    IndexerRow::EventLog(r) => acc.0.push(r.clone()),
                    IndexerRow::Creator(r) => acc.1.push(r.clone()),
                    IndexerRow::CreatorSoftDelete { creator_address } => {
                        acc.2.push(creator_address.clone())
                    }
                    IndexerRow::CreatorUpdate { .. } => acc.3.push(row.clone()),
                    IndexerRow::Post(r) => acc.4.push(r.clone()),
                    IndexerRow::PostSoftDelete { .. } => acc.5.push(row.clone()),
                    IndexerRow::Subscription(r) => acc.6.push(r.clone()),
                }
                acc
            },
        );

        if !event_logs.is_empty() {
            total += AsyncExecute::execute(
                diesel::insert_into(events_log::table).values(&event_logs),
                conn,
            )
            .await?;
        }

        for c in creators {
            let _ = AsyncExecute::execute(
                diesel::insert_into(creators::table)
                    .values(&c)
                    .on_conflict(creators::service_object_id)
                    .do_update()
                    .set((
                        creators::name.eq(&c.name),
                        creators::description.eq(&c.description),
                        creators::avatar_blob_id.eq(&c.avatar_blob_id),
                        creators::suins_name.eq(&c.suins_name),
                        creators::updated_at.eq(chrono::Utc::now()),
                    )),
                conn,
            )
            .await?;
            total += 1;
        }

        for creator_address in creator_deletes {
            let n = AsyncExecute::execute(
                diesel::update(creators::table)
                    .filter(creators::creator_address.eq(&creator_address))
                    .set(creators::deleted_at.eq(chrono::Utc::now())),
                conn,
            )
            .await?;
            total += n;
        }

        for row in creator_updates {
            if let IndexerRow::CreatorUpdate {
                creator_address,
                name,
                description,
                avatar_blob_id,
                suins_name,
            } = row
            {
                let patch = CreatorUpdatePatch {
                    name: name.clone(),
                    description: description.clone(),
                    avatar_blob_id: avatar_blob_id.clone(),
                    suins_name: suins_name.clone(),
                };
                if name.is_some()
                    || description.is_some()
                    || avatar_blob_id.is_some()
                    || suins_name.is_some()
                {
                    let n = AsyncExecute::execute(
                        diesel::update(creators::table)
                            .filter(creators::creator_address.eq(&creator_address))
                            .set((
                                patch,
                                creators::updated_at.eq(chrono::Utc::now()),
                            )),
                        conn,
                    )
                    .await?;
                    total += n;
                }
            }
        }

        for p in post_inserts {
            let _ = AsyncExecute::execute(
                diesel::insert_into(posts::table)
                    .values(&p)
                    .on_conflict((posts::service_object_id, posts::post_id))
                    .do_update()
                    .set((
                        posts::title.eq(&p.title),
                        posts::metadata_blob_id.eq(&p.metadata_blob_id),
                        posts::data_blob_id.eq(&p.data_blob_id),
                        posts::required_tier.eq(p.required_tier),
                    )),
                conn,
            )
            .await?;
            total += 1;
        }

        for row in post_deletes {
            if let IndexerRow::PostSoftDelete {
                service_object_id,
                post_id,
            } = row
            {
                let n = AsyncExecute::execute(
                    diesel::update(posts::table)
                        .filter(
                            posts::service_object_id
                                .eq(service_object_id)
                                .and(posts::post_id.eq(post_id)),
                        )
                        .set(posts::deleted_at.eq(chrono::Utc::now())),
                    conn,
                )
                .await?;
                total += n;
            }
        }

        for s in sub_upserts {
            let _ = AsyncExecute::execute(
                diesel::insert_into(subscriptions::table)
                    .values(&s)
                    .on_conflict((subscriptions::subscriber_address, subscriptions::service_object_id))
                    .do_update()
                    .set((
                        subscriptions::tier_level.eq(s.tier_level),
                        subscriptions::expires_at_ms.eq(s.expires_at_ms),
                    )),
                conn,
            )
            .await?;
            total += 1;
        }

        Ok(total)
    }
}
