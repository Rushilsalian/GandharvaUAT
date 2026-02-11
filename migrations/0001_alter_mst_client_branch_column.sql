-- Migration to increase branch column width in mst_client table from 20 to 100 characters
ALTER TABLE mst_client MODIFY COLUMN branch VARCHAR(100) NULL;