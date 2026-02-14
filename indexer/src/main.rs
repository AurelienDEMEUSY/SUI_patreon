mod handlers;

pub use depatreon_indexer::{models, schema};

use anyhow::{bail, Result};
use clap::Parser;
use diesel_migrations::{embed_migrations, EmbeddedMigrations};
use handlers::EventLogHandler;
use sui_indexer_alt_framework::{
    cluster::{Args, IndexerCluster},
    pipeline::sequential::SequentialConfig,
    service::Error,
};
use url::Url;

const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv().ok();

    let database_url: Url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set (e.g. postgres://user@localhost:5432/depatreon_indexer)")
        .parse()
        .expect("Invalid DATABASE_URL");

    let args = Args::parse();

    let mut cluster = IndexerCluster::builder()
        .with_args(args)
        .with_database_url(database_url)
        .with_migrations(&MIGRATIONS)
        .build()
        .await?;

    cluster
        .sequential_pipeline(EventLogHandler::new(), SequentialConfig::default())
        .await?;

    match cluster.run().await?.main().await {
        Ok(()) | Err(Error::Terminated) => Ok(()),
        Err(Error::Aborted) => bail!("Indexer aborted due to an unexpected error"),
        Err(Error::Task(e)) => bail!(e),
    }
}
