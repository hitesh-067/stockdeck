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

    public User getUser(Long id) throws Exception {
        return userRepository.findById(id).orElseThrow(() -> new Exception("User not found"));
    }

    public User updateUser(Long id, String newUsername, String newEmail) throws Exception {
        User user = getUser(id);
        
        // Check if new email is taken by someone else
        if (!user.getEmail().equals(newEmail) && userRepository.existsByEmail(newEmail)) {
            throw new Exception("Email already in use");
        }
        
        user.setUsername(newUsername);
        user.setEmail(newEmail);
        return userRepository.save(user);
    }

    public void changePassword(Long id, String oldPassword, String newPassword) throws Exception {
        User user = getUser(id);
        if (!user.getPassword().equals(oldPassword)) {
            throw new Exception("Incorrect old password");
        }
        user.setPassword(newPassword);
        userRepository.save(user);
    }

    public void deleteUser(Long id) throws Exception {
        User user = getUser(id);
        userRepository.delete(user);
    }
}
