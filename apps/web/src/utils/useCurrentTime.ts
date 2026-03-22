'use client';

import { useState, useEffect } from 'react';
import moment from 'moment';

interface CurrentTimeType {
  date: string;
  time: string;
}

const useCurrentTime = (): CurrentTimeType => {
  const [currentTime, setCurrentTime] = useState(new Date());

  const UpdateTime = () => {
    setCurrentTime(new Date());
  };
  useEffect(() => {
    setInterval(UpdateTime);
  }, []);

  return {
    date: moment(currentTime).format('DD/MM/YYYY'),
    time: moment(currentTime).format('HH:mm:ss'),
  };
};
export default useCurrentTime;
