const { client } = require('../config/elasticsearch-config');
const logger = require('../utils/logger');

async function getAllQueryBuilder(req, res) {
    const username = res.locals.username;
    try {
        const body = await client.search({
            index: 'querybuilder',
            body: {
                query: {
                    term: {
                        username,
                    },
                },
            },
        });
        const results = body.hits.hits.map((hit) => {
            return {
                id: hit._id,
                ...hit._source,
            };
        });
        logger.info('Data received from getAllQueryBuilder');
        res.status(200).json(results);
    } catch (error) {
        logger.error(`Error retrieving data from getAllQueryBuilder: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getQueryBuilder(req, res) {
    const { id } = req.params;
    const username = res.locals.username;
    try {
        const body = await client.search({
            index: 'querybuilder',
            body: {
                query: {
                    bool: {
                        must: [
                            { match: { _id: id } },
                            { term: { username } },
                        ],
                    },
                },
            },
        });
        const results = body.hits.hits.map((hit) => {
            return {
                id: hit._id,
                ...hit._source,
            };
        });
        logger.info('Data received from getQueryBuilder');
        res.status(200).json(results);
    } catch (error) {
        logger.error(`Error retrieving data from getQueryBuilder: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function postQueryBuilder(req, res) {
    const { name, description, queryBuilderParams } = req.body;
    const username = res.locals.username;
    try {
        const body = await client.index({
            index: 'querybuilder',
            body: {
                username,
                name,
                description,
                queryBuilderParams,
            },
        });
        logger.info('Data entered from postQueryBuilder');
        res.status(201).json({ id: body._id, name, description, queryBuilderParams });
    } catch (error) {
        logger.error(`Error adding data to querybuilder: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteQueryBuilder(req, res) {
    const { id } = req.params;
    const username = res.locals.username;
    try {
        const verifyOwnership = await client.search({
            index: 'querybuilder',
            body: {
                query: {
                    bool: {
                        must: [
                            { match: { _id: id } },
                            { term: { username } },
                        ],
                    },
                },
            },
        });
        if (verifyOwnership.hits.hits.length === 0) {
            res.status(404).json({ message: 'Query not found' });
            return;
        }
        await client.delete({
            index: 'querybuilder',
            id,
        });
        logger.info('Data deleted from deleteQueryBuilder');
        res.status(200).json({ message: 'Deleted successfully', id });
    } catch (error) {
        logger.error(`Error deleting data from querybuilder: ${error}`);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getAllQueryBuilder,
    getQueryBuilder,
    postQueryBuilder,
    deleteQueryBuilder,
};
