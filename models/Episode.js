module.exports = (sequelize, DataTypes) => {
  const Episode = sequelize.define('Episode', {
    code: { type: DataTypes.STRING, allowNull: false },
    episode_number: { type: DataTypes.INTEGER, allowNull: false },
    locked: { type: DataTypes.BOOLEAN, defaultValue: false },
    lang: { type: DataTypes.STRING, defaultValue: 'en' }
  }, {
    tableName: 'episodes',
    timestamps: true,
    indexes: [{ fields: ['code', 'lang'] }]
  });
  return Episode;
};
