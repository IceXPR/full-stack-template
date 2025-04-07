import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User";

// TypeORM DataSource configuration
export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: true, // Set to false in production
    logging: true,
    entities: [User],
    subscribers: [],
    migrations: [],
}); 