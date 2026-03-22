declare module "*.svg" {
    import React from "react";
    import { SvgProps } from "react-native-svg";
    const content: React.FC<SvgProps>;
    export default content;
}

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";

declare module "expo-sqlite" {
    interface SQLiteDatabase {
        name: string;
        execSync(sql: string): void;
        runSync(sql: string, params?: any[]): void;
        getAllSync(sql: string, params?: any[]): any[];
        getFirstSync(sql: string, params?: any[]): any;
    }
    namespace SQLite {
        type SQLiteDatabase = SQLiteDatabase;
    }
    function openDatabaseSync(name: string): SQLiteDatabase;
    const SQLite: {
        openDatabaseSync: typeof openDatabaseSync;
        execSync(database: SQLiteDatabase, sql: string): void;
        runSync(database: SQLiteDatabase, sql: string, params?: any[]): void;
        getAllSync(database: SQLiteDatabase, sql: string, params?: any[]): any[];
        getFirstSync(database: SQLiteDatabase, sql: string, params?: any[]): any;
    };
    export = SQLite;
}
