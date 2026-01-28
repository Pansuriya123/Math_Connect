import React from 'react';
import Navbar from '../components/Navbar';

const AuthHome = () => {
  return (
    <>
      <Navbar navDisabled={false} enableProfileWhenDisabled={true} />
      <main style={{ paddingTop: '4.25rem' }}>
        {/* Auth-only mode: intentionally empty home */}
      </main>
    </>
  );
};

export default AuthHome;

