class Delivery {
  constructor(id, yachtId, captainId, origin, destination, departureDate, estimatedArrival, status) {
    this.id = id;
    this.yachtId = yachtId;
    this.captainId = captainId;
    this.origin = origin;
    this.destination = destination;
    this.departureDate = departureDate;
    this.estimatedArrival = estimatedArrival;
    this.status = status || 'scheduled'; // scheduled, in-progress, completed, cancelled
    this.createdAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      yachtId: this.yachtId,
      captainId: this.captainId,
      origin: this.origin,
      destination: this.destination,
      departureDate: this.departureDate,
      estimatedArrival: this.estimatedArrival,
      status: this.status,
      createdAt: this.createdAt
    };
  }
}

module.exports = Delivery;
