import sql from 'mssql';

const defaultConfig: sql.config = {
    server: process.env.DB_SERVER || 'simrusqlmi.public.3927760fc80b.database.windows.net',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3342,
    database: process.env.DB_NAME || 'platform_orchestrator_anfp-dev_dev',
    user: process.env.DB_USER || 'supera',
    password: process.env.DB_PASSWORD || 'BucifalEDoarUnCal!1504AMIN',
    options: {
        trustServerCertificate: true,
    }
};

export class ConnectionManager {
    private pool: sql.ConnectionPool | null = null;
    private config: sql.config;

    constructor(config?: sql.config) {
        this.config = config || defaultConfig;
    }

    async getConnection(): Promise<sql.ConnectionPool> {
        if (!this.pool) {
            this.pool = await sql.connect(this.config);
        }
        return this.pool;
    }

    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.close();
            this.pool = null;
        }
    }
}

const connectionManager = new ConnectionManager();
export default connectionManager;