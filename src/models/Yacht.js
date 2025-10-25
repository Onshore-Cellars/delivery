class Yacht {
  constructor(id, name, type, length, owner, homePort) {
    this.id = id;
    this.name = name;
    this.type = type; // sailboat, motor yacht, catamaran, etc.
    this.length = length; // in feet
    this.owner = owner;
    this.homePort = homePort;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      length: this.length,
      owner: this.owner,
      homePort: this.homePort
    };
  }
}

module.exports = Yacht;
