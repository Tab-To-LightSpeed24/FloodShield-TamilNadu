import { Sun, Moon, Cloud, CloudSun, CloudMoon, CloudRain, CloudSnow, CloudLightning, Haze } from 'lucide-react';
import { FC } from 'react';

interface WeatherIconProps {
  iconCode: string;
  className?: string;
}

export const WeatherIcon: FC<WeatherIconProps> = ({ iconCode, ...props }) => {
  const iconMap: { [key: string]: JSX.Element } = {
    '01d': <Sun {...props} />,
    '01n': <Moon {...props} />,
    '02d': <CloudSun {...props} />,
    '02n': <CloudMoon {...props} />,
    '03d': <Cloud {...props} />,
    '03n': <Cloud {...props} />,
    '04d': <Cloud {...props} />,
    '04n': <Cloud {...props} />,
    '09d': <CloudRain {...props} />,
    '09n': <CloudRain {...props} />,
    '10d': <CloudRain {...props} />,
    '10n': <CloudRain {...props} />,
    '11d': <CloudLightning {...props} />,
    '11n': <CloudLightning {...props} />,
    '13d': <CloudSnow {...props} />,
    '13n': <CloudSnow {...props} />,
    '50d': <Haze {...props} />,
    '50n': <Haze {...props} />,
  };

  return iconMap[iconCode] || <Sun {...props} />;
};