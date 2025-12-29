module.exports = (sequelize, DataTypes) => {
  const Title = sequelize.define('Title', {
    code: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    cover_url: { type: DataTypes.STRING, allowNull: true },
    episodes_total: { type: DataTypes.INTEGER, defaultValue: 0 },
    lang: { type: DataTypes.STRING, defaultValue: 'en' },
    last_synced_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'titles',
    timestamps: true,
    indexes: [{ unique: true, fields: ['code'] }]
  });
  return Title;
};
