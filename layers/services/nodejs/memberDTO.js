class MemberDTO {
  static transform(member) {
    const id = member.PK && typeof member.PK === 'string' && member.PK.includes('#')
      ? member.PK.split('#')[1]
      : null;

      return {
          id: id,
          phoneNumber: member.phoneNumber,
          emailedInvitation: member.emailedInvitation,
          dinnerSelection: member.dinnerSelection,
          lastName: member.lastName,
          email: member.email,
          firstName: member.firstName,
          plannedTransportation: member.plannedTransportation,
          specialSippingpreference: member.specialSippingpreference,
          checkIn: member.checkIn
      };
  }

  static transformList(members) {
      return members.map(member => this.transform(member));
  }
}

module.exports = MemberDTO;
