import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from 'child_process';

export async function setup() {
  console.log("🚀 Subindo container do banco de teste...");
  
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("test_db")
    .withUsername("test_user")
    .withPassword("test_password")
    .start();

  process.env.DATABASE_URL = container.getConnectionUri();

  console.log(`📦 Banco rodando em: ${process.env.DATABASE_URL}`);

  execSync('npx prisma db push --schema prisma/schema.prisma', { stdio: 'inherit' });
  execSync('npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/add_balance_check_constraint.sql', { stdio: 'inherit' });

  return async () => {
    console.log("🛑 Destruindo container...");
    await container.stop();
  };
}
