exports.calculateCurrentPrice = (priceData) => {
  if (priceData && priceData.base) {
    const { base, discount_percentage = 0 } = priceData;
    priceData.current = base - (base * discount_percentage) / 100;
  }
  return priceData;
};
