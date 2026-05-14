package at.fhtw.swen.tourplanner.controller;

import at.fhtw.swen.tourplanner.controller.request.LoginRequest;
import at.fhtw.swen.tourplanner.controller.request.RegisterRequest;
import at.fhtw.swen.tourplanner.controller.response.AuthResponse;
import at.fhtw.swen.tourplanner.controller.response.LoginResponse;
import at.fhtw.swen.tourplanner.service.AuthService;
import at.fhtw.swen.tourplanner.service.UserService;
import at.fhtw.swen.tourplanner.service.dto.UserDto;
import at.fhtw.swen.tourplanner.security.spring.CurrentUserService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserService userService;
    private final AuthService authService;
    private final CurrentUserService currentUserService;

    public AuthController(
            UserService userService,
            AuthService authService,
            CurrentUserService currentUserService
    ) {
        this.userService = userService;
        this.authService = authService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/user/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request) {

        UserDto user = userService.register(
                request.username(),
                request.password(),
                request.email()
        );

        LoginResponse login = authService.login(
                request.username(),
                request.password()
        );

        return new AuthResponse(
                user.id(),
                user.username(),
                user.createdAt(),
                login.token()
        );
    }

    @PostMapping("/user/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(
                request.username(),
                request.password()
        );
    }

    @PostMapping("/user/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader("Authorization") String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new SecurityException("Missing token");
        }

        String token = authHeader.substring(7);
        authService.logout(token);
    }

    @DeleteMapping("/user")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser() {
        userService.deleteUser(currentUserService.getUserId());
    }
}