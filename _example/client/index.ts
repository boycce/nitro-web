import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { setupApp, onChange } from 'nitro-web'

import config from './config'
import './css/index.css'
import { Layout1, Layout2 } from '../components/partials/layouts'

Object.assign(window, {
  // application globals
  onChange: onChange,
  sharedStore: undefined, // defined in setupApp
  sharedStoreCache: undefined, // defined in setupApp

  // dependency globals
  Link: Link,
  useCallback: useCallback,
  useEffect: useEffect,
  useLocation: useLocation,
  useNavigate: useNavigate,
  useImperativeHandle: useImperativeHandle,
  useMemo: useMemo,
  useParams: useParams,
  useRef: useRef,
  useState: useState,
})

// Fetch state and start app
setupApp(config, [Layout1, Layout2])
