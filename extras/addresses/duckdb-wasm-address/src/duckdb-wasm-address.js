/*!
 * rexxjs/duckdb-wasm-address v1.0.0 | (c) 2025 RexxJS Project | MIT License
 * @rexxjs-meta=DUCKDB_WASM_ADDRESS_META
 */
/**
 * DuckDB-WASM ADDRESS Library - Provides an in-process analytical database via ADDRESS interface
 * This is an ADDRESS target library, not a functions library
 *
 * Usage:
 *   REQUIRE "duckdb-wasm-address"
 *   ADDRESS DUCKDB
 *   LET result = query sql="SELECT 42;"
 *
 * Copyright (c) 2025 RexxJS Project
 * Licensed under the MIT License
 */

let duckdb = null;
try {
  if (typeof require !== 'undefined') {
    duckdb = require('@duckdb/duckdb-wasm');
  } else if (typeof window !== 'undefined' && window.duckdb) {
    duckdb = window.duckdb;
  }
} catch (e) {
  // DuckDB-WASM is expected to be loaded externally
}

let dbInstance = null;
let dbLoadingPromise = null;
let dbConnection = null;

async function getDb() {
    if (dbInstance) {
        return dbInstance;
    }

    if (dbLoadingPromise) {
        return dbLoadingPromise;
    }

    if (!duckdb) {
        throw new Error('DuckDB-WASM is not loaded. Make sure to include it in your environment.');
    }

    console.log("Loading DuckDB-WASM...");
    dbLoadingPromise = (async () => {
        const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
        const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
        const worker = new Worker(bundle.mainWorker);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        return db;
    })();

    dbInstance = await dbLoadingPromise;
    console.log("DuckDB-WASM loaded successfully.");
    dbLoadingPromise = null;
    return dbInstance;
}

async function getConnection() {
    if (dbConnection) {
        return dbConnection;
    }
    const db = await getDb();
    dbConnection = await db.connect();
    return dbConnection;
}

// DuckDB WASM ADDRESS metadata function
function DUCKDB_WASM_ADDRESS_META() {
    // DuckDB-WASM works in both Node.js and browser environments
    return {
        canonical: "org.rexxjs/duckdb-wasm-address",
        type: 'address-handler',
        name: 'DuckDB Service (WASM)',
        version: '1.0.0',
        description: 'In-process analytical database via DuckDB-WASM (portable, pure-JS)',
        provides: {
            addressTarget: 'duckdb',
            handlerFunction: 'ADDRESS_DUCKDB_WASM_HANDLER',
            commandSupport: true,
            methodSupport: true
        },
        dependencies: {
            "@duckdb/duckdb-wasm": "^1.28.0"
        },
        envVars: [],
        loaded: true,
        requirements: {
            environment: 'both',  // Works in both Node.js and browser
            modules: ['@duckdb/duckdb-wasm']
        },
        duckdbAvailable: typeof duckdb !== 'undefined'
    };
}

async function ADDRESS_DUCKDB_WASM_HANDLER(method, params) {
    try {
        const c = await getConnection();
        let result;

        if (typeof method === 'string' && !params) {
            result = await c.query(method);
            return { success: true, result: result.toArray().map(row => row.toJSON()), output: "Query successful" };
        }

        switch (method.toLowerCase()) {
            case 'query':
                const sql = params.sql || params.query;
                if (typeof sql !== 'string') {
                    throw new Error('The "sql" parameter must be a string.');
                }
                result = await c.query(sql);
                const resultArray = result.toArray().map(row => row.toJSON());
                return { success: true, result: resultArray, output: JSON.stringify(resultArray) };

            case 'status':
                const db = await getDb();
                return {
                    success: true,
                    result: {
                        version: await db.getVersion(),
                        featureFlags: await db.getFeatureFlags(),
                        connection: dbConnection ? 'connected' : 'disconnected'
                    }
                };

            case 'register_file_url':
                const { url, name, protocol } = params;
                const db_reg = await getDb();
                await db_reg.registerFileURL(name, url, protocol || duckdb.DuckDBDataProtocol.HTTP, false);
                return { success: true, output: `File '${name}' registered from URL.` };

            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    } catch (error) {
        return {
            success: false,
            result: null,
            error: error.message,
            output: '',
            errorMessage: error.message,
            errorCode: 1,
        };
    }
}

const ADDRESS_DUCKDB_WASM_METHODS = {
    query: {
        description: "Execute a SQL query.",
        params: ["sql"],
        returns: "The result of the query as an array of objects."
    },
    status: {
        description: "Get the status of the DuckDB service.",
        params: [],
        returns: "An object with status information."
    },
    register_file_url: {
        description: "Register a file from a URL.",
        params: ["name", "url", "protocol"],
        returns: "Status message."
    }
};

if (typeof window !== 'undefined') {
    window.DUCKDB_WASM_ADDRESS_META = DUCKDB_WASM_ADDRESS_META;
    window.ADDRESS_DUCKDB_WASM_HANDLER = ADDRESS_DUCKDB_WASM_HANDLER;
    window.ADDRESS_DUCKDB_WASM_METHODS = ADDRESS_DUCKDB_WASM_METHODS;
} else if (typeof global !== 'undefined') {
    global.DUCKDB_WASM_ADDRESS_META = DUCKDB_WASM_ADDRESS_META;
    global.ADDRESS_DUCKDB_WASM_HANDLER = ADDRESS_DUCKDB_WASM_HANDLER;
    global.ADDRESS_DUCKDB_WASM_METHODS = ADDRESS_DUCKDB_WASM_METHODS;
}

// Export via CommonJS for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DUCKDB_WASM_ADDRESS_META,
        ADDRESS_DUCKDB_WASM_HANDLER,
        ADDRESS_DUCKDB_WASM_METHODS
    };
}
