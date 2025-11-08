class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  //filter
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "keyword"];
    excludedFields.forEach((el) => delete queryObj[el]);
    //advanced filter gte gt lte lt
    //covnert object to json
    let querySTR = JSON.stringify(queryObj);
    //adding dollar sign to let mongoose understand it
    querySTR = querySTR.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // convert it back from json to object
    this.query = this.query.find(JSON.parse(querySTR));
    return this;
  }
  // 2️⃣ SORTING
  sort() {
    if (this.queryString.sort) {
      // Example: sort=price,-ratingsAverage
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // Default sorting (by creation date, newest first)
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }
  // 3️⃣ FIELD LIMITING (select specific fields)
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // Exclude internal fields by default
      this.query = this.query.select("-__v");
    }
    return this;
  }
  // 4️⃣ PAGINATION
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 20;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
  // 5️⃣ SEARCH (optional for text-based fields like name, description, etc.)
  search() {
    if (this.queryString.keyword) {
      const keyword = this.queryString.keyword.trim();
      // Modify this according to your model (e.g., product name or brand)
      this.query = this.query.find({
        $or: [
          { "name.en": { $regex: keyword, $options: "i" } },
          { "name.ar": { $regex: keyword, $options: "i" } },
        ],
      });
    }
    return this;
  }
}
module.exports = ApiFeatures;
