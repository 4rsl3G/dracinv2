'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Cache Entries
    await queryInterface.createTable('cache_entries', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      cache_key: { type: Sequelize.STRING, unique: true, allowNull: false },
      endpoint: { type: Sequelize.STRING },
      lang: { type: Sequelize.STRING },
      query: { type: Sequelize.STRING },
      code: { type: Sequelize.STRING },
      ep: { type: Sequelize.INTEGER },
      payload_json: { type: Sequelize.TEXT('long') },
      ttl_seconds: { type: Sequelize.INTEGER },
      expires_at: { type: Sequelize.DATE },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
    // 2. Titles
    await queryInterface.createTable('titles', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      code: { type: Sequelize.STRING, unique: true },
      name: { type: Sequelize.STRING },
      cover_url: { type: Sequelize.STRING },
      episodes_total: { type: Sequelize.INTEGER },
      lang: { type: Sequelize.STRING },
      last_synced_at: { type: Sequelize.DATE },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
    // 3. Episodes
    await queryInterface.createTable('episodes', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      code: { type: Sequelize.STRING },
      episode_number: { type: Sequelize.INTEGER },
      locked: { type: Sequelize.BOOLEAN },
      lang: { type: Sequelize.STRING },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
    await queryInterface.addIndex('episodes', ['code', 'lang']);

    // 4. Watch History
    await queryInterface.createTable('watch_history', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      client_id: { type: Sequelize.STRING },
      code: { type: Sequelize.STRING },
      episode_number: { type: Sequelize.INTEGER },
      position_seconds: { type: Sequelize.INTEGER },
      duration_seconds: { type: Sequelize.INTEGER },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
    await queryInterface.addIndex('watch_history', ['client_id', 'code']);
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('watch_history');
    await queryInterface.dropTable('episodes');
    await queryInterface.dropTable('titles');
    await queryInterface.dropTable('cache_entries');
  }
};
