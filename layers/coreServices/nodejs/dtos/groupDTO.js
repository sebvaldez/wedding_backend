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

  static transformList(groups) {
      return groups.map(group => this.transform(group));
  }
}

module.exports = GroupDTO;
