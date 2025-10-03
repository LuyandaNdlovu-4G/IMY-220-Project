import React from 'react';  
import { Link } from 'react-router-dom';

function SplashContent() {
    return(
        <main className="splash-content">
            <div className="logo-container">
                <img src="/assets/images/Code Cave Logo.png" alt="Code Cave Logo" className="splash-logo-img" />
            </div>
            <h2>
                Collaborate. Version. Share
            </h2>
            <p className="subtitle">
                 Build code projects with your peers. <br/>
                Check in and out. Track changes. Stay in sync <br/>
                Your personal developer hub clean, fast and secure.
            </p>
            <Link to="/home" className="btn get-started-btn">
                Get Started
            </Link>
        </main>
    );
}

export default SplashContent;