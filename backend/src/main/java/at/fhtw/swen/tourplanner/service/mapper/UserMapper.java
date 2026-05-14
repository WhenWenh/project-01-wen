package at.fhtw.swen.tourplanner.service.mapper;

import at.fhtw.swen.tourplanner.persistence.entity.User;
import at.fhtw.swen.tourplanner.service.dto.UserDto;

public class UserMapper {

    public static UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getPasswordHash(), // maps to passwordHash
                user.getEmail(),
                user.getCreatedAt()
        );
    }

    public static User toEntity(UserDto dto) {
        return new User(
                dto.id(),
                dto.username(),
                dto.passwordHash(),  // correct accessor
                dto.email(),
                dto.createdAt()
        );
    }
}