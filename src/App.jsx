import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Facebook, Linkedin, Youtube, Phone, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const RotatingText = forwardRef((props, ref) => {
  const {
    texts,
    transition = { type: 'spring', damping: 25, stiffness: 300 },
    initial = { y: '100%', opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: '-120%', opacity: 0 },
    animatePresenceMode = 'wait',
    animatePresenceInitial = false,
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const splitIntoCharacters = text => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), segment => segment.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === 'characters') {
      const words = currentText.split(' ');
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1
      }));
    }
    if (splitBy === 'words') {
      return currentText.split(' ').map((word, i, arr) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1
      }));
    }
    if (splitBy === 'lines') {
      return currentText.split('\n').map((line, i, arr) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1
      }));
    }

    return currentText.split(splitBy).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback(
    (index, totalChars) => {
      const total = totalChars;
      if (staggerFrom === 'first') return index * staggerDuration;
      if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
      if (staggerFrom === 'center') {
        const center = Math.floor(total / 2);
        return Math.abs(center - index) * staggerDuration;
      }
      if (staggerFrom === 'random') {
        const randomIndex = Math.floor(Math.random() * total);
        return Math.abs(randomIndex - index) * staggerDuration;
      }
      return Math.abs(staggerFrom - index) * staggerDuration;
    },
    [staggerFrom, staggerDuration]
  );

  const handleIndexChange = useCallback(
    newIndex => {
      setCurrentTextIndex(newIndex);
      if (onNext) onNext(newIndex);
    },
    [onNext]
  );

  const next = useCallback(() => {
    const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const previous = useCallback(() => {
    const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex);
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange]);

  const jumpTo = useCallback(
    index => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1));
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex);
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  );

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) {
      handleIndexChange(0);
    }
  }, [currentTextIndex, handleIndexChange]);

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset
    }),
    [next, previous, jumpTo, reset]
  );

  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);

  return (
    <motion.span className={cn('text-rotate', mainClassName)} {...rest} layout transition={transition}>
      <span className="text-rotate-sr-only">{texts[currentTextIndex]}</span>
      <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
        <motion.span
          key={currentTextIndex}
          className={cn(splitBy === 'lines' ? 'text-rotate-lines' : 'text-rotate')}
          layout
          aria-hidden="true"
        >
          {elements.map((wordObj, wordIndex, array) => {
            const previousCharsCount = array.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0);
            return (
              <span key={wordIndex} className={cn('text-rotate-word', splitLevelClassName)}>
                {wordObj.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(
                        previousCharsCount + charIndex,
                        array.reduce((sum, word) => sum + word.characters.length, 0)
                      )
                    }}
                    className={cn('text-rotate-element', elementLevelClassName)}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span className="text-rotate-space"> </span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});

RotatingText.displayName = 'RotatingText';

const Header = () => (
  <header className="flex flex-col md:flex-row items-center justify-between p-6 w-full max-w-7xl mx-auto z-50 relative">
    {/* Logo */}
    <div className="text-white text-3xl font-bold tracking-widest mb-4 md:mb-0">
      VANGUARD
    </div>

    {/* Main Navigation */}
    <nav className="flex space-x-8 text-sm text-gray-300 font-semibold tracking-wide">
      <a href="#about" className="hover:text-white transition-colors">SOBRE NÓS</a>
      <a href="#services" className="hover:text-white transition-colors">SERVIÇOS</a>
      <a href="#projects" className="hover:text-white transition-colors">PROJETOS</a>
    </nav>

    {/* Social & Contact */}
    <div className="hidden md:flex items-center space-x-3">
      <a href="#" className="border border-gray-500 p-1.5 hover:bg-white hover:text-black text-gray-400 transition-colors">
        <Facebook size={16} />
      </a>
      <a href="#" className="border border-gray-500 p-1.5 hover:bg-white hover:text-black text-gray-400 transition-colors">
        <Linkedin size={16} />
      </a>
      <a href="#" className="border border-gray-500 p-1.5 hover:bg-white hover:text-black text-gray-400 transition-colors">
        <Youtube size={16} />
      </a>
      <div className="border border-gray-500 px-3 py-1.5 flex items-center text-gray-300 text-sm font-semibold tracking-wide ml-2">
        <Phone size={14} className="mr-2" />
        1 (866) 555-5555
      </div>
    </div>
  </header>
);

const Hero = () => (
  <div className="flex flex-col items-center text-center mt-16 md:mt-24 px-4 relative z-10">
    <h2 className="text-gray-400 text-sm md:text-base font-semibold tracking-[0.2em] uppercase mb-4">
      Quando a rapidez no mercado importa, confie na Vanguard
    </h2>
    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-wider mb-2 drop-shadow-lg flex flex-col md:flex-row items-center justify-center gap-4 md:gap-5">
      <span className="font-light">DIGITAL</span>
      <RotatingText
        texts={['BACKBONE', 'REDES', 'SISTEMAS', 'SOLUÇÕES']}
        mainClassName="overflow-hidden justify-center pb-1"
        staggerFrom={"last"}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-120%" }}
        staggerDuration={0.025}
        splitLevelClassName="overflow-hidden pb-1"
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        rotationInterval={3000}
      />
    </h1>
    <p className="text-gray-400 text-lg tracking-[0.3em] uppercase mb-8 mt-4">EXPERTISE</p>
    
    <button className="border border-white/50 text-white px-8 py-3 text-sm font-semibold tracking-widest hover:bg-white hover:text-gray-900 transition-all duration-300 flex flex-col items-center group backdrop-blur-sm">
      SAIBA MAIS
      <ChevronDown size={20} className="mt-2 text-gray-400 group-hover:text-gray-900 transition-colors" />
    </button>
  </div>
);

const Hexagon = ({ title, bgImage }) => (
  <div 
    className="relative w-64 h-72 md:w-72 md:h-80 group cursor-pointer overflow-hidden transform transition-transform duration-300 hover:scale-105 mx-2 my-2 md:my-0"
    style={{ 
      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    }}
  >
    {/* Background Image */}
    <div 
      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
      style={{ backgroundImage: `url(${bgImage})` }}
    />
    
    {/* Dark Overlay */}
    <div className="absolute inset-0 bg-[#0b1622]/70 group-hover:bg-[#0b1622]/50 transition-colors duration-300" />
    
    {/* Content */}
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
      <h3 className="text-white font-bold text-lg tracking-widest mb-4 uppercase">{title}</h3>
      <button className="border border-white/50 text-white text-xs font-semibold px-4 py-2 hover:bg-white hover:text-[#0b1622] transition-colors">
        SAIBA MAIS
      </button>
    </div>
  </div>
);

const HexagonGrid = () => {
  const hexagons = [
    { title: 'Produtos', bgImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80' },
    { title: 'Serviços', bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80' },
    { title: 'Mercados', bgImage: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80' },
    { title: 'Casos de Sucesso', bgImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80' },
    { title: 'Notícias e Eventos', bgImage: 'https://images.unsplash.com/photo-1590487988256-9ed24133863e?auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="relative z-10 mt-20 md:mt-32 mb-20 flex flex-col items-center w-full max-w-6xl mx-auto px-4">
      {/* Top Row */}
      <div className="flex flex-col md:flex-row justify-center items-center md:items-start w-full">
        {hexagons.slice(0, 3).map((hex, index) => (
          <Hexagon key={index} {...hex} />
        ))}
      </div>
      
      {/* Bottom Row - Negative margin to create honeycomb effect on desktop */}
      <div className="flex flex-col md:flex-row justify-center items-center w-full md:-mt-[76px]">
        {hexagons.slice(3, 5).map((hex, index) => (
          <Hexagon key={index} {...hex} />
        ))}
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="w-full relative z-10 bg-[#09111a]/80 backdrop-blur-md pt-16 pb-8 px-6 border-t border-white/10 mt-auto">
    <div className="max-w-6xl mx-auto">
      {/* Company Description */}
      <div className="text-center mb-16 px-4 md:px-20">
        <p className="text-gray-400 text-sm leading-relaxed tracking-wide">
          A Vanguard fornece hardware, software, expertise técnica e suporte de engenharia para as forças armadas, comunidades de inteligência e mercados comerciais. A Internet das Coisas Industrial (IIoT)™ é impulsionada pela Vanguard.
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent w-full mb-12 opacity-50"></div>

      {/* Footer Links Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-sm">
        {/* Column 1 */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold tracking-widest mb-2 uppercase text-xs">Sobre Nós</h4>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Mensagem do CEO</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Agilidade de Mercado</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Equipa de Gestão</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Conselho Consultivo</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Instalações</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Mercados que Servimos</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Notícias e Eventos</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Carreiras</a>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold tracking-widest mb-2 uppercase text-xs">Serviços</h4>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Engenharia Total de Sistemas</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Programa de Prototipagem Rápida</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Gestão Empresarial</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Arquitetura e Design Organizacional</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Desenvolvimento de Software</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Design Eletrónico e Mecânico</a>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold tracking-widest mb-2 uppercase text-xs">Produtos</h4>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Produtos de Defesa e Inteligência</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Produtos Industriais e Comerciais</a>
        </div>

        {/* Column 4 */}
        <div className="flex flex-col space-y-3">
          <h4 className="text-white font-bold tracking-widest mb-2 uppercase text-xs">Contacte-nos</h4>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Perguntas Gerais</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Solicitar Mais Informações</a>
          <a href="#" className="text-gray-400 hover:text-white transition-colors">Solicitar Suporte</a>
          
          <div className="flex items-center space-x-2 mt-4">
            <a href="#" className="border border-gray-600 p-1 hover:bg-white hover:text-black text-gray-400 transition-colors"><Facebook size={14} /></a>
            <a href="#" className="border border-gray-600 p-1 hover:bg-white hover:text-black text-gray-400 transition-colors"><Linkedin size={14} /></a>
            <a href="#" className="border border-gray-600 p-1 hover:bg-white hover:text-black text-gray-400 transition-colors"><Youtube size={14} /></a>
          </div>
          
          <div className="border border-gray-600 px-3 py-1.5 inline-block text-gray-400 text-xs w-max mt-2">
            1 (866) 555-5555
          </div>
          
          <address className="not-italic text-gray-500 text-xs leading-relaxed mt-4">
            2425 Wilson Blvd, Suite 400<br />
            Arlington, VA 22201
          </address>
        </div>
      </div>

      <div className="h-px bg-white/10 w-full mb-6"></div>

      {/* Copyright */}
      <div className="flex flex-col md:flex-row justify-center items-center text-xs text-gray-500 space-y-2 md:space-y-0 md:space-x-4">
        <span>© Copyright 2013-2026. Todos os Direitos Reservados.</span>
        <div className="hidden md:block w-1 h-1 bg-gray-600 rounded-full"></div>
        <a href="#" className="hover:text-gray-300 transition-colors">Termos de Uso</a>
        <div className="hidden md:block w-1 h-1 bg-gray-600 rounded-full"></div>
        <a href="#" className="hover:text-gray-300 transition-colors">Política de Privacidade</a>
      </div>
    </div>
  </footer>
);

const App = () => {
  return (
    <div className="min-h-screen bg-[#060d14] font-sans selection:bg-cyan-900 selection:text-white flex flex-col relative overflow-x-hidden">
      <style>{`
        .text-rotate {
          display: flex;
          flex-wrap: wrap;
          white-space: pre-wrap;
          position: relative;
        }

        .text-rotate-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .text-rotate-word {
          display: inline-flex;
        }

        .text-rotate-lines {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .text-rotate-element {
          display: inline-block;
        }

        .text-rotate-space {
          white-space: pre;
        }
      `}</style>

      {/* Background with overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2000&q=80")',
        }}
      >
        {/* Gradient overlay to transition from dark blue to solid dark at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1624]/80 via-[#07101a]/90 to-[#060d14]"></div>
      </div>

      <Header />
      
      <main className="flex-grow flex flex-col w-full relative z-10">
        <Hero />
        <HexagonGrid />
      </main>

      <Footer />
    </div>
  );
};

export default App;
