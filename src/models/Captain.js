class Captain {
  constructor(id, name, license, experience, specializations) {
    this.id = id;
    this.name = name;
    this.license = license; // captain's license number
    this.experience = experience; // years of experience
    this.specializations = specializations; // array of yacht types
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      license: this.license,
      experience: this.experience,
      specializations: this.specializations
    };
  }
}

module.exports = Captain;
