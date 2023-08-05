// memberDTO.js

class MemberDTO {
  static transform(member) {
    const id = member.PK && typeof member.PK === 'string' && member.PK.includes('#')
      ? member.PK.split('#')[1]
      : null;

    let groupId = member.SK && typeof member.SK === 'string' && member.SK.includes('GROUP#')
      ? member.SK.split('#')[1]
      : null;

    // Set groupId to null if it's 'NO_GROUP'
    if (groupId === 'NO_GROUP') {
      groupId = null;
    }

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
        checkIn: member.checkIn,
        groupId: groupId,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
    };
  }

  static transformList(members) {
      return members.map(member => this.transform(member));
  }
}

module.exports = MemberDTO;
