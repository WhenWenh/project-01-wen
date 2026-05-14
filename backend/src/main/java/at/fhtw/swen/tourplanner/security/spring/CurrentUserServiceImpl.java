package at.fhtw.swen.tourplanner.security.spring;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CurrentUserServiceImpl implements CurrentUserService {

    @Override
    public UUID getUserId() {
        return getPrincipal().getUserId();
    }

    @Override
    public String getUsername() {
        return getPrincipal().getUsername();
    }

    private JwtUserDetails getPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !(auth.getPrincipal() instanceof JwtUserDetails user)) {
            throw new AccessDeniedException("Not authenticated");
        }

        return user;
    }
}