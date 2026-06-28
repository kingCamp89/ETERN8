import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import IntroExperience from '@/components/shared/IntroExperience';
import { hasSeenIntro, markIntroSeen } from '@/lib/introStorage';

export default function Intro() {
  const navigate = useNavigate();
  const [alreadySeen] = useState(() => hasSeenIntro());

  useEffect(() => {
    if (alreadySeen) {
      navigate('/', { replace: true });
    }
  }, [alreadySeen, navigate]);

  if (alreadySeen) return null;

  const finish = () => {
    markIntroSeen();
    navigate('/', { replace: true });
  };

  return (
    <IntroExperience
      mode="page"
      onComplete={finish}
      onDismiss={finish}
    />
  );
}
