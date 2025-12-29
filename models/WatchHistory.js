module.exports = (sequelize, DataTypes) => {
  const WatchHistory = sequelize.define('WatchHistory', {
    client_id: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    episode_number: { type: DataTypes.INTEGER, allowNull: false },
    position_seconds: { type: DataTypes.INTEGER, defaultValue: 0 },
    duration_seconds: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    tableName: 'watch_history',
    timestamps: true,
    indexes: [{ fields: ['client_id', 'code'] }]
  });
  return WatchHistory;
};
