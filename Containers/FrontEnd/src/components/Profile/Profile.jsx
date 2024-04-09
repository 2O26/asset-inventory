// Profile.jsx
import React from 'react'
import UserService from '../Services/UserService';
import './Profile.css'

function containsNumber(str) {
    return /\d/.test(str);
}

console.log("roles: ", UserService.getRoles())
export default function Profile() {
    return (
        <div className='center-flex-column'>

            <div className='profile-container'>
                <h3 style={{ textAlign: "center" }}>Hello {UserService.getFirstname()}</h3>
                <a>First Name: {UserService.getFirstname()}</a>
                <a>Last Name: {UserService.getLastname()}</a>
                <a>Email: {UserService.getEmail()}</a>
                <a>Access Rights: {
                    UserService.getRoles().map((key) =>
                        (containsNumber(key) || key === "admin") && <p key={key} className='access-rights'>{key}</p>
                    )
                }</a>

            </div>
        </div>
    );
}
