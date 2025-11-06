# SQLite ADDRESS Target Reference

The SQLite ADDRESS target provides SQL database operations via the REXX ADDRESS interface. This allows REXX scripts to interact with SQLite databases using both classic ADDRESS syntax and modern method calls.

## Loading the Library

```rexx
REQUIRE "sqlite-address"
ADDRESS SQL
```

## Basic Usage

### Classic REXX ADDRESS Syntax

```rexx
REQUIRE "sqlite-address"
ADDRESS SQL

-- Create table
"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"
SAY "Table created, RC=" RC

-- Insert data
"INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com')"
SAY "Insert completed, RC=" RC ", Last ID=" SQLCODE

-- Query data
"SELECT * FROM users WHERE name LIKE '%John%'"
SAY "Query completed, RC=" RC
SAY "Results: " RESULT
```

### Modern Method Call Syntax

```rexx
REQUIRE "sqlite-address"
ADDRESS SQL

LET create_result = execute sql="CREATE TABLE products (id INTEGER, name TEXT, price REAL)"
SAY "Create success: " create_result.success

LET insert_result = execute sql="INSERT INTO products (name, price) VALUES ('Widget', 19.99)"
SAY "Inserted ID: " insert_result.lastInsertId

LET query_result = execute sql="SELECT * FROM products"
SAY "Found " query_result.count " products"
```

## REXX Variables

### Standard REXX Variables
- **RC** - Return code (0 for success, non-zero for failure)
- **RESULT** - Command output or result data
- **ERRORTEXT** - Error message (only set on failure)

### SQL-Specific Variables  
- **SQLCODE** - SQL-specific status code (0 for success, -1 for error)

## Available Methods

### execute(sql=string)
Execute a SQL statement (CREATE, INSERT, UPDATE, DELETE, SELECT).

**Parameters:**
- `sql` - The SQL statement to execute

**Returns:**
- `operation` - Type of SQL operation performed
- `success` - Boolean success status
- `sql` - The executed SQL statement
- `rowsAffected` - Number of rows affected (for INSERT/UPDATE/DELETE)
- `lastInsertId` - Last inserted row ID (for INSERT)
- `rows` - Result rows (for SELECT)
- `count` - Number of result rows (for SELECT)

### query(sql=string, params=array)
Execute a parameterized SQL query with bound parameters.

**Parameters:**
- `sql` - SQL statement with ? placeholders
- `params` - Array of parameter values

**Returns:** Same as execute()

### status()
Get database service status and information.

**Returns:**
- `service` - Always "sqlite"
- `version` - SQLite version
- `database` - Database file path (":memory:" for in-memory)
- `methods` - Array of available methods
- `timestamp` - Current timestamp

### close()
Close the database connection.

**Returns:**
- `operation` - Always "CLOSE"
- `success` - Boolean success status
- `message` - Status message

## SQL Operations

### CREATE TABLE
```rexx
"CREATE TABLE inventory (id INTEGER PRIMARY KEY, item TEXT, quantity INTEGER)"
-- RC=0 on success, operation=CREATE_TABLE
```

### INSERT
```rexx
"INSERT INTO inventory (item, quantity) VALUES ('Apples', 50)"
-- RC=0 on success, operation=INSERT, lastInsertId available
```

### SELECT
```rexx
"SELECT * FROM inventory WHERE quantity > 10"
-- RC=0 on success, operation=SELECT, rows/count available in RESULT
```

### UPDATE/DELETE
```rexx
"UPDATE inventory SET quantity = 25 WHERE item = 'Apples'"
"DELETE FROM inventory WHERE quantity = 0"
-- RC=0 on success, rowsAffected available
```

## Parameterized Queries

```rexx
ADDRESS SQL
LET result = query sql="INSERT INTO users (name, email) VALUES (?, ?)" params=["Alice Smith", "alice@example.com"]
SAY "Inserted user with ID: " result.lastInsertId
```

## Error Handling

```rexx
ADDRESS SQL
"CREATE INVALID SQL SYNTAX"
IF RC != 0 THEN DO
  SAY "SQL Error occurred:"
  SAY "  Error Code: " RC
  SAY "  SQL Code: " SQLCODE
  SAY "  Message: " ERRORTEXT
END
```

## Multiple Operations

```rexx
ADDRESS SQL

-- Transaction-like operations
"CREATE TABLE orders (id INTEGER PRIMARY KEY, customer TEXT, amount REAL)"
"INSERT INTO orders (customer, amount) VALUES ('Customer A', 100.50)"
"INSERT INTO orders (customer, amount) VALUES ('Customer B', 250.75)"
"SELECT SUM(amount) as total FROM orders"

SAY "Total orders: " RESULT
```

## Environment Requirements

- **Node.js only** - Not available in browser environments
- **sqlite3 module** - Automatically checked, install with `npm install sqlite3`
- **In-memory database** - Uses `:memory:` database for testing by default

## Database Connection

The SQLite ADDRESS target maintains a single database connection per interpreter instance:
- First SQL command creates the connection
- Connection persists until explicitly closed or interpreter terminates  
- Uses in-memory database (`:memory:`) for isolation and testing
- Connection can be closed with `close()` method

## Best Practices

1. **Check return codes**: Always check RC after SQL operations
2. **Handle errors gracefully**: Use SQLCODE and ERRORTEXT for detailed error information
3. **Use parameterized queries**: For dynamic data to prevent SQL injection
4. **Close connections**: Call `close()` method when done with database operations
5. **Test SQL syntax**: Use simple queries first to verify connection

## Integration with INTERPRET

The ADDRESS SQL context is inherited by INTERPRET statements:

```rexx
ADDRESS SQL
INTERPRET "CREATE TABLE test (id INTEGER)"
-- SQL context automatically available in interpreted code
```

This allows dynamic SQL generation and execution within REXX scripts.