package com.stockdeck.service;

import com.stockdeck.model.User;
import com.stockdeck.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public User register(User user) throws Exception {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new Exception("Email already exists");
        }
        // In a real app, hash password here.
        return userRepository.save(user);
    }

    public User login(String email, String password) throws Exception {
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isPresent()) {
            User user = optionalUser.get();
            // In a real app, compare hashed password here.
            if (user.getPassword().equals(password)) {
                return user;
            }
        }
        throw new Exception("Invalid credentials");
    }
}
