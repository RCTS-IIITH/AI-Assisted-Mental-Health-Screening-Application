import React from 'react';
import Navbar from './Navbar';
import './ThankYou.css';

function ThankYou() {
    const handleRedirect = () => {
        window.location.href = '/'; // Redirect to the home URL
    };

    return (
        <div className='ThankYou-Container'>
            <Navbar />
            <div className='Outside-TY'>
                <div className='TY-Box' onClick={handleRedirect}>
                    <div className='TY-Text'>
                        Thank you for taking out time to chat.<br />
                        We will reach out to you soon!
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ThankYou;