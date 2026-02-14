//! Minimal REST API for querying indexed DePatreon data.
//! Run: cargo run --bin api
//!
//! Endpoints:
//!   GET /creators              - List creators (from indexed data)
//!   GET /creators/:id          - Get creator by service_object_id
//!   GET /creators/:id/posts    - Get posts for a creator
//!   GET /subscriptions         - List subscriptions (?subscriber=0x...)
//!   GET /subscriptions/check    - Check subscription (?subscriber=0x...&service_id=0x...)
//!   GET /health                - Health check

use axum::{
    extract::{Path, Query},
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use diesel::prelude::*;
use diesel::OptionalExtension;
use diesel_async::AsyncConnection;
use diesel::Queryable;
use diesel_async::{AsyncPgConnection, RunQueryDsl};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use url::Url;

#[derive(Queryable, serde::Serialize)]
struct CreatorRow {
    service_object_id: String,
    creator_address: String,
    name: String,
    description: String,
    avatar_blob_id: Option<String>,
    suins_name: Option<String>,
    total_subscribers: i32,
    total_posts: i32,
}

#[derive(Queryable, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PostRow {
    post_id: i32,
    title: String,
    metadata_blob_id: Option<String>,
    data_blob_id: Option<String>,
    required_tier: i32,
    created_at_ms: i64,
}

#[derive(Queryable, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct SubscriptionRow {
    subscriber_address: String,
    service_object_id: String,
    tier_level: i32,
    expires_at_ms: i64,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct SubscriptionCheckResponse {
    tier_level: i32,
    expires_at_ms: i64,
}

#[derive(serde::Deserialize)]
struct CreatorsQuery {
    #[serde(rename = "creator_address")]
    creator_address: Option<String>,
}

async fn list_creators(
    Query(params): Query<CreatorsQuery>,
) -> Result<Json<Vec<CreatorRow>>, (StatusCode, String)> {
    let mut conn = db_connection().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("DB error: {}", e),
        )
    })?;

    use depatreon_indexer::schema::creators::dsl::*;
    let mut query = creators
        .filter(deleted_at.is_null())
        .into_boxed();
    if let Some(ref addr) = params.creator_address {
        query = query.filter(creator_address.eq(addr));
    }
    let results = query
        .select((
            service_object_id,
            creator_address,
            name,
            description,
            avatar_blob_id,
            suins_name,
            total_subscribers,
            total_posts,
        ))
        .load::<CreatorRow>(&mut conn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Query error: {}", e)))?;

    Ok(Json(results))
}

async fn get_creator(
    Path(id): Path<String>,
) -> Result<Json<Option<CreatorRow>>, (StatusCode, String)> {
    let mut conn = db_connection().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("DB error: {}", e),
        )
    })?;

    use depatreon_indexer::schema::creators::dsl::*;
    let result = creators
        .filter(service_object_id.eq(&id))
        .filter(deleted_at.is_null())
        .select((
            service_object_id,
            creator_address,
            name,
            description,
            avatar_blob_id,
            suins_name,
            total_subscribers,
            total_posts,
        ))
        .first::<CreatorRow>(&mut conn)
        .await
        .optional()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Query error: {}", e)))?;

    Ok(Json(result))
}

#[derive(serde::Deserialize)]
struct CreatorPostsPath {
    id: String,
}

async fn get_creator_posts(
    Path(params): Path<CreatorPostsPath>,
) -> Result<Json<Vec<PostRow>>, (StatusCode, String)> {
    let mut conn = db_connection().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("DB error: {}", e),
        )
    })?;

    use depatreon_indexer::schema::posts::dsl::*;
    let results = posts
        .filter(service_object_id.eq(&params.id))
        .filter(deleted_at.is_null())
        .select((post_id, title, metadata_blob_id, data_blob_id, required_tier, created_at_ms))
        .order(created_at_ms.desc())
        .load::<PostRow>(&mut conn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Query error: {}", e)))?;

    Ok(Json(results))
}

#[derive(serde::Deserialize)]
struct SubscriptionsQuery {
    subscriber: String,
}

async fn list_subscriptions(
    Query(params): Query<SubscriptionsQuery>,
) -> Result<Json<Vec<SubscriptionRow>>, (StatusCode, String)> {
    let mut conn = db_connection().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("DB error: {}", e),
        )
    })?;

    use depatreon_indexer::schema::subscriptions::dsl::*;
    let results = subscriptions
        .filter(subscriber_address.eq(&params.subscriber))
        .filter(expires_at_ms.gt(chrono::Utc::now().timestamp_millis()))
        .select((subscriber_address, service_object_id, tier_level, expires_at_ms))
        .load::<SubscriptionRow>(&mut conn)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Query error: {}", e)))?;

    Ok(Json(results))
}

#[derive(serde::Deserialize)]
struct SubscriptionCheckQuery {
    subscriber: String,
    service_id: String,
}

async fn check_subscription(
    Query(params): Query<SubscriptionCheckQuery>,
) -> Result<Json<Option<SubscriptionCheckResponse>>, (StatusCode, String)> {
    let mut conn = db_connection().await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("DB error: {}", e),
        )
    })?;

    use depatreon_indexer::schema::subscriptions::dsl::*;
    let result = subscriptions
        .filter(subscriber_address.eq(&params.subscriber))
        .filter(service_object_id.eq(&params.service_id))
        .filter(expires_at_ms.gt(chrono::Utc::now().timestamp_millis()))
        .select((tier_level, expires_at_ms))
        .first::<(i32, i64)>(&mut conn)
        .await
        .optional()
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Query error: {}", e)))?;

    Ok(Json(result.map(|(tl, exp)| SubscriptionCheckResponse {
        tier_level: tl,
        expires_at_ms: exp,
    })))
}

async fn health() -> &'static str {
    "ok"
}

async fn db_connection() -> anyhow::Result<AsyncPgConnection> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://localhost/depatreon_indexer".to_string());
    let url: Url = database_url.parse()?;
    let conn_str = url.to_string();
    AsyncPgConnection::establish(&conn_str).await.map_err(Into::into)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    let app = Router::new()
        .route("/creators", get(list_creators))
        .route("/creators/:id", get(get_creator))
        .route("/creators/:id/posts", get(get_creator_posts))
        .route("/subscriptions", get(list_subscriptions))
        .route("/subscriptions/check", get(check_subscription))
        .route("/health", get(health))
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    println!("DePatreon Indexer API listening on http://{}", addr);

    axum::serve(
        tokio::net::TcpListener::bind(addr).await?,
        app,
    )
    .await?;

    Ok(())
}
