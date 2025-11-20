import sql from 'mssql';

const defaultConfig: sql.config = {
    server: process.env.DB_SERVER || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    database: process.env.DB_NAME || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
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