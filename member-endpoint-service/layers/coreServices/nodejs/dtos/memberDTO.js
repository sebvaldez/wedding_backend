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
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phoneNumber: member.phoneNumber,
        rsvpTextUpdates: member.rsvpTextUpdates,
        emailedInvitation: member.emailedInvitation,
        attending: member.attending,
        dinnerSelection: member.dinnerSelection,
        foodAllergies: member.foodAllergies,
        plannedTransportation: member.plannedTransportation,
        specialSippingPreference: member.specialSippingPreference,
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
