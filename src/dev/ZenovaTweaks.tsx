import { useEffect } from 'react';
import {
  TweaksPanel,
  TweakSection,
  TweakRadio,
  TweakColor,
  TweakSlider,
  TweakToggle,
} from './TweaksPanel';
import { PALETTES, applyPalette } from '@/lib/palette';
import type { Tweaks, TweaksSetter, Theme } from '@/types/tweaks';

interface ZenovaTweaksProps {
  tweaks: Tweaks;
  setTweak: TweaksSetter;
}

export function ZenovaTweaks({ tweaks, setTweak }: ZenovaTweaksProps) {
  useEffect(() => {
    applyPalette(tweaks.palette);
  }, [tweaks.palette]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <TweakRadio<'Dark' | 'Light'>
        label="Mode"
        value={tweaks.theme === 'light' ? 'Light' : 'Dark'}
        options={['Dark', 'Light']}
        onChange={(v) => setTweak('theme', v.toLowerCase() as Theme)}
      />

      <TweakSection label="Brand palette" />
      <TweakColor
        label="Accents"
        value={tweaks.palette}
        options={Object.values(PALETTES)}
        onChange={(v) => setTweak('palette', v as Tweaks['palette'])}
      />

      <TweakSection label="Hero" />
      <TweakSlider
        label="Word rotation"
        value={tweaks.rotateMs}
        min={1200}
        max={5000}
        step={100}
        unit="ms"
        onChange={(v) => setTweak('rotateMs', v)}
      />

      <TweakSection label="Sections" />
      <TweakToggle
        label="Client marquee"
        value={tweaks.showMarquee}
        onChange={(v) => setTweak('showMarquee', v)}
      />
      <TweakToggle
        label="Testimonials"
        value={tweaks.showTestimonials}
        onChange={(v) => setTweak('showTestimonials', v)}
      />
    </TweaksPanel>
  );
}
