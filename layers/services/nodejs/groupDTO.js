// groupDTO.js

class GroupDTO {
  static transform(group) {
      return {
          id: group.PK.split('#')[1],
          name: group.name,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
          groupSize: group.groupSize
      };
  }

  // If needed, you can add a transformList method for multiple groups.
}

module.exports = GroupDTO;
