const axios = require('axios');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

const API_URL = 'https://data.cityofnewyork.us/resource/ic3t-wcy2.json';

async function fetchPermits(backfill = false) {
    try {
        const today = new Date();
        let startDate = new Date();
        if (backfill) {
            startDate.setFullYear(today.getFullYear() - 1);
        } else {
            startDate.setDate(today.getDate() - 7);
        }

        const startDateStr = startDate.toISOString().split('T')[0];
        const query = `issue_date >= '${startDateStr}' AND (permit_type = 'New Building' OR permit_type = 'Office to Rental Conversion') AND proposed_unit_count >= 20 AND (community_board LIKE '%MANHATTAN%' OR community_board LIKE '%BROOKLYN%' OR community_board LIKE '%QUEENS%')`;

        const response = await axios.get(API_URL, { params: { $where: query, $limit: 50000 } });
        const permits = response.data;

        if (permits.length === 0) {
            console.log('No permits found');
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `permits_${timestamp}.csv`;
        const csvWriter = createObjectCsvWriter({
            path: filename,
            header: [
                {id: 'address', title: 'ADDRESS'},
                {id: 'community_board', title: 'BOROUGH'},
                {id: 'permit_type', title: 'PERMIT_TYPE'},
                {id: 'proposed_unit_count', title: 'PROPOSED_UNIT_COUNT'},
                {id: 'owner_name', title: 'OWNER_NAME'}
            ]
        });

        await csvWriter.writeRecords(permits);
        console.log(`Created ${filename} with ${permits.length} permits`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

fetchPermits(process.argv.includes('--backfill'));
