module.exports = (sequelize, DataTypes) => {
  const CacheEntry = sequelize.define('CacheEntry', {
    cache_key: { type: DataTypes.STRING, unique: true, allowNull: false },
    endpoint: { type: DataTypes.STRING, allowNull: false },
    lang: { type: DataTypes.STRING, allowNull: true },
    query: { type: DataTypes.STRING, allowNull: true },
    code: { type: DataTypes.STRING, allowNull: true },
    ep: { type: DataTypes.INTEGER, allowNull: true },
    payload_json: { type: DataTypes.TEXT('long'), allowNull: false },
    ttl_seconds: { type: DataTypes.INTEGER, defaultValue: 300 },
    expires_at: { type: DataTypes.DATE, allowNull: false }
  }, {
    tableName: 'cache_entries',
    timestamps: true,
    indexes: [{ unique: true, fields: ['cache_key'] }]
  });
  return CacheEntry;
};
