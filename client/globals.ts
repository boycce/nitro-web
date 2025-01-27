import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { onChange } from 'nitro-web'
import { useTracked } from './store'

declare global {
  // Common application globals
  const onChange: typeof import('nitro-web').onChange
  /** Global shared store, a react-tracked container initialized in `setupApp()` */
  let useTracked: typeof import('./store').useTracked

  // Common aependency globals
  /** The public API for rendering a history-aware `<a>`. */
  const Link: typeof import('react-router-dom').Link
  const useCallback: typeof import('react').useCallback
  const useEffect: typeof import('react').useEffect
  const useImperativeHandle: typeof import('react').useImperativeHandle
  const useLocation: typeof import('react-router-dom').useLocation
  const useMemo: typeof import('react').useMemo
  const useNavigate: typeof import('react-router-dom').useNavigate
  const useParams: typeof import('react-router-dom').useParams
  const useRef: typeof import('react').useRef
  const useState: typeof import('react').useState
}

Object.assign(window, {
  // application globals
  onChange: onChange,
  useTracked: useTracked,

  // dependency globals
  Link: Link,
  useCallback: useCallback,
  useEffect: useEffect,
  useImperativeHandle: useImperativeHandle,
  useLocation: useLocation,
  useMemo: useMemo,
  useNavigate: useNavigate,
  useParams: useParams,
  useRef: useRef,
  useState: useState,
})