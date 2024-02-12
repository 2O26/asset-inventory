import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { LogIn } from "../Services/ApiService";
import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
import './SignIn.css'
import '../../assets/styles/Button.css'

export default function SignIn() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({ email: "", password: "" });

    // Setup mutation
    const { mutate, isLoading, isError } = useMutation({
        mutationFn: LogIn, // Directly pass the LogIn function
        onSuccess: (data) => {
            // Handle success logic here, no need for useEffect
            if (data.success) {
                navigate("/");
            } else {
                console.log("Could not login user");
            }
        },
        onError: (error) => {
            // Optionally handle error state
            console.error("Login error:", error);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutate(userData); // Use mutate with the user data to trigger the login
    };

    return (
        <div className="page-container">
            <div className="auth-form-container">
                <h2>Sign in</h2>
                <form className="signin-form" onSubmit={handleSubmit}>
                    <label htmlFor="email">Email Address</label>
                    <input
                        className="inputFields"
                        value={userData.email}
                        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                        type="email"
                        placeholder="email@example.com"
                        id="email"
                        name="email"
                        required
                    />
                    <label htmlFor="password">Password</label>
                    <input
                        className="inputFields"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        type="password"
                        placeholder="********"
                        id="password"
                        name="password"
                        required
                    />
                    {isLoading && <LoadingSpinner />}
                    {isError && <p className="errorMessage">Sign In Failed</p>}
                    <div className="AuthBtnContainer">
                        <button className="standard-button" disabled={isLoading} type="submit">Sign in</button>
                    </div>
                    {/* Links */}
                </form>
            </div>
        </div>
    );
}
