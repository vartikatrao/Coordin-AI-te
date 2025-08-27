import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { Box, Button, Text } from '@chakra-ui/react'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Home/Hero'
import Options from '@/components/Home/Options'
import Collections from '@/components/Home/Collections'
import Localities from '@/components/Home/Localities'
const inter = Inter({ subsets: ['latin'] })

export default function Home() {

  return (
    <>
      <Head>
        <title>CoordinAIte</title>
        <meta name="description" content="Coordinate better. Meet faster. Travel safer." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box 
        bgImage={'/background_landing.png'} 
        backgroundSize={'cover'}
        backgroundPosition={'center'} 
        backgroundRepeat={'no-repeat'} 
        h={'100vh'} 
        bgColor={'#f8f9fa'}
      >
        <Navbar />
        <Hero />
      </Box>
      <Box className="options-section">
        <Options />
      </Box>
      <Collections />
      <Localities />
      <Explore />
    </>
  )
}
import React from "react"; import Explore from '@/components/Home/Explore'

