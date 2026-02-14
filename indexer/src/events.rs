//! Parse DePatreon Move events from checkpoint transactions.
//!
//! Event BCS layouts (from contract):
//! - CreatorRegistered: (creator: address, name: String)
//! - CreatorDeleted: (creator: address)
//! - ProfileUpdated: (creator: address, name: String)
//! - PostPublished: (creator: address, post_id: u64, required_tier: u64)
//! - PostUpdated: (creator: address, post_id: u64)
//! - PostDeleted: (creator: address, post_id: u64)
//! - SubscriptionPurchased: (subscriber: address, creator: address, tier: u64, expires_at_ms: u64)
//! - SubscriptionRenewed: (subscriber: address, creator: address, tier: u64, new_expires_at_ms: u64)
//! - SuinsNameLinked: (creator: address, suins_name: String, service_id: ID)

use anyhow::{anyhow, Result};
use move_core_types::account_address::AccountAddress;
use sui_types::base_types::{ObjectID, SuiAddress};
use sui_types::event::Event;

/// BCS decode: read u64 LEB128
fn read_u64_leb128(bytes: &[u8], cursor: &mut usize) -> Result<u64> {
    let mut value: u64 = 0;
    let mut shift = 0;
    loop {
        if *cursor >= bytes.len() {
            return Err(anyhow!("Unexpected end"));
        }
        let byte = bytes[*cursor];
        *cursor += 1;
        value |= ((byte & 0x7F) as u64) << shift;
        if byte & 0x80 == 0 {
            break;
        }
        shift += 7;
        if shift >= 64 {
            return Err(anyhow!("LEB128 overflow"));
        }
    }
    Ok(value)
}

/// BCS decode: read 32-byte address
fn read_address(bytes: &[u8], cursor: &mut usize) -> Result<SuiAddress> {
    if *cursor + 32 > bytes.len() {
        return Err(anyhow!("Not enough bytes for address"));
    }
    let addr = AccountAddress::from_bytes(&bytes[*cursor..*cursor + 32])
        .map_err(|e| anyhow!("Invalid address: {}", e))?;
    *cursor += 32;
    Ok(SuiAddress::from(addr))
}

/// BCS decode: read length-prefixed UTF-8 string
fn read_string(bytes: &[u8], cursor: &mut usize) -> Result<String> {
    let len = read_u64_leb128(bytes, cursor)? as usize;
    if *cursor + len > bytes.len() {
        return Err(anyhow!("String length {} exceeds remaining bytes", len));
    }
    let s = String::from_utf8(bytes[*cursor..*cursor + len].to_vec())
        .map_err(|e| anyhow!("Invalid UTF-8: {}", e))?;
    *cursor += len;
    Ok(s)
}

/// BCS decode: read ObjectID (same as address, 32 bytes)
fn read_object_id(bytes: &[u8], cursor: &mut usize) -> Result<ObjectID> {
    if *cursor + 32 > bytes.len() {
        return Err(anyhow!("Not enough bytes for ObjectID"));
    }
    let id = ObjectID::from_bytes(&bytes[*cursor..*cursor + 32])
        .map_err(|e| anyhow!("Invalid ObjectID: {:?}", e))?;
    *cursor += 32;
    Ok(id)
}

#[derive(Debug, Clone)]
pub struct CreatorRegisteredEvent {
    pub creator: SuiAddress,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct CreatorDeletedEvent {
    pub creator: SuiAddress,
}

#[derive(Debug, Clone)]
pub struct ProfileUpdatedEvent {
    pub creator: SuiAddress,
    pub name: String,
}

#[derive(Debug, Clone)]
pub struct PostPublishedEvent {
    pub creator: SuiAddress,
    pub post_id: u64,
    pub required_tier: u64,
}

#[derive(Debug, Clone)]
pub struct PostUpdatedEvent {
    pub creator: SuiAddress,
    pub post_id: u64,
}

#[derive(Debug, Clone)]
pub struct PostDeletedEvent {
    pub creator: SuiAddress,
    pub post_id: u64,
}

#[derive(Debug, Clone)]
pub struct SubscriptionPurchasedEvent {
    pub subscriber: SuiAddress,
    pub creator: SuiAddress,
    pub tier: u64,
    pub expires_at_ms: u64,
}

#[derive(Debug, Clone)]
pub struct SubscriptionRenewedEvent {
    pub subscriber: SuiAddress,
    pub creator: SuiAddress,
    pub tier: u64,
    pub new_expires_at_ms: u64,
}

#[derive(Debug, Clone)]
pub struct SuinsNameLinkedEvent {
    pub creator: SuiAddress,
    pub suins_name: String,
    pub service_id: ObjectID,
}

/// Parse event contents by type.
pub fn parse_depatreon_event(
    event: &Event,
    package_prefix: &str,
) -> Option<Result<DepatreonEvent>> {
    let type_str = event.type_.to_string();
    if !type_str.starts_with(package_prefix) {
        return None;
    }

    let result = if type_str.ends_with("::service::CreatorRegistered") {
        parse_creator_registered(&event.contents).map(DepatreonEvent::CreatorRegistered)
    } else if type_str.ends_with("::service::CreatorDeleted") {
        parse_creator_deleted(&event.contents).map(DepatreonEvent::CreatorDeleted)
    } else if type_str.ends_with("::service::ProfileUpdated") {
        parse_profile_updated(&event.contents).map(DepatreonEvent::ProfileUpdated)
    } else if type_str.ends_with("::service::PostPublished") {
        parse_post_published(&event.contents).map(DepatreonEvent::PostPublished)
    } else if type_str.ends_with("::service::PostUpdated") {
        parse_post_updated(&event.contents).map(DepatreonEvent::PostUpdated)
    } else if type_str.ends_with("::service::PostDeleted") {
        parse_post_deleted(&event.contents).map(DepatreonEvent::PostDeleted)
    } else if type_str.ends_with("::subscription::SubscriptionPurchased") {
        parse_subscription_purchased(&event.contents).map(DepatreonEvent::SubscriptionPurchased)
    } else if type_str.ends_with("::subscription::SubscriptionRenewed") {
        parse_subscription_renewed(&event.contents).map(DepatreonEvent::SubscriptionRenewed)
    } else if type_str.ends_with("::service::SuinsNameLinked") {
        parse_suins_name_linked(&event.contents).map(DepatreonEvent::SuinsNameLinked)
    } else {
        return None;
    };

    Some(result)
}

#[derive(Debug, Clone)]
pub enum DepatreonEvent {
    CreatorRegistered(CreatorRegisteredEvent),
    CreatorDeleted(CreatorDeletedEvent),
    ProfileUpdated(ProfileUpdatedEvent),
    PostPublished(PostPublishedEvent),
    PostUpdated(PostUpdatedEvent),
    PostDeleted(PostDeletedEvent),
    SubscriptionPurchased(SubscriptionPurchasedEvent),
    SubscriptionRenewed(SubscriptionRenewedEvent),
    SuinsNameLinked(SuinsNameLinkedEvent),
}

fn parse_creator_registered(contents: &[u8]) -> Result<CreatorRegisteredEvent> {
    let mut c = 0;
    let creator = read_address(contents, &mut c)?;
    let name = read_string(contents, &mut c)?;
    Ok(CreatorRegisteredEvent { creator, name })
}

fn parse_creator_deleted(contents: &[u8]) -> Result<CreatorDeletedEvent> {
    let mut c = 0;
    let creator = read_address(contents, &mut c)?;
    Ok(CreatorDeletedEvent { creator })
}

fn parse_profile_updated(contents: &[u8]) -> Result<ProfileUpdatedEvent> {
    let mut c = 0;
    let creator = read_address(contents, &mut c)?;
    let name = read_string(contents, &mut c)?;
    Ok(ProfileUpdatedEvent { creator, name })
}

fn parse_post_published(contents: &[u8]) -> Result<PostPublishedEvent> {
    let mut c = 0;
    let creator = read_address(contents, &mut c)?;
    let post_id = read_u64_leb128(contents, &mut c)?;
    let required_tier = read_u64_leb128(contents, &mut c)?;
    Ok(PostPublishedEvent {
        creator,
        post_id,
        required_tier,
    })
}

fn parse_post_updated(contents: &[u8]) -> Result<PostUpdatedEvent> {
    let mut c = 0;
    let creator = read_address(contents, &mut c)?;
    let post_id = read_u64_leb128(contents, &mut c)?;
    Ok(PostUpdatedEvent { creator, post_id })
}

fn parse_post_deleted(contents: &[u8]) -> Result<PostDeletedEvent> {
    let mut c = 0;
    let creator = read_address(contents, &mut c)?;
    let post_id = read_u64_leb128(contents, &mut c)?;
    Ok(PostDeletedEvent { creator, post_id })
}

fn parse_subscription_purchased(contents: &[u8]) -> Result<SubscriptionPurchasedEvent> {
    let mut c = 0;
    let subscriber = read_address(contents, &mut c)?;
    let creator = read_address(contents, &mut c)?;
    let tier = read_u64_leb128(contents, &mut c)?;
    let expires_at_ms = read_u64_leb128(contents, &mut c)?;
    Ok(SubscriptionPurchasedEvent {
        subscriber,
        creator,
        tier,
        expires_at_ms,
    })
}

fn parse_subscription_renewed(contents: &[u8]) -> Result<SubscriptionRenewedEvent> {
    let mut c = 0;
    let subscriber = read_address(contents, &mut c)?;
    let creator = read_address(contents, &mut c)?;
    let tier = read_u64_leb128(contents, &mut c)?;
    let new_expires_at_ms = read_u64_leb128(contents, &mut c)?;
    Ok(SubscriptionRenewedEvent {
        subscriber,
        creator,
        tier,
        new_expires_at_ms,
    })
}

fn parse_suins_name_linked(contents: &[u8]) -> Result<SuinsNameLinkedEvent> {
    let mut c = 0;
    let creator = read_address(contents, &mut c)?;
    let suins_name = read_string(contents, &mut c)?;
    let service_id = read_object_id(contents, &mut c)?;
    Ok(SuinsNameLinkedEvent {
        creator,
        suins_name,
        service_id,
    })
}
