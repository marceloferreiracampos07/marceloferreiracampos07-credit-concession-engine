import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Iniciando carga inicial do banco de dados (Seed)...");

    const defaultTenantId = "00000000-0000-0000-0000-000000000001";
    const SALDO_INICIAL = 10000;

    const tenantExistente = await prisma.tenant.findUnique({
        where: { id: defaultTenantId },
    });

    if (!tenantExistente) {
        await prisma.tenant.create({
            data: {
                id: defaultTenantId,
                name: "Tenant Padrão",
                webhookUrl: "https://webhook.default.com",
                webhookFormat: "JSON",
                webhookSecret: "change-me",
            },
        });
        console.log(`✅ Tenant ${defaultTenantId} criado.`);
    }

    const fundoExistente = await prisma.fundo.findUnique({
        where: { tenantId: defaultTenantId },
    });

    if (!fundoExistente) {
        const novoFundo = await prisma.fundo.create({
            data: {
                tenantId: defaultTenantId,
                balance: SALDO_INICIAL,
            },
        });
        console.log(`✅ Fundo inicial criado para o Tenant ${novoFundo.tenantId} com saldo R$ ${novoFundo.balance}`);
    } else {
        console.log(`ℹ️ Fundo já existe para o Tenant ${defaultTenantId}. Saldo atual: R$ ${fundoExistente.balance}`);
    }
}

main()
    .catch((e) => {
        console.error("❌ Erro ao executar seed do banco:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
