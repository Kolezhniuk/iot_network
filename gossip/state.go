package main

import (
	"bytes"
	"strconv"
	"sync"
	"time"

	"encoding/gob"

	"github.com/weaveworks/mesh"
)

type state struct {
	mtx  sync.RWMutex
	data map[string]string
	self mesh.PeerName
}

// state implements GossipData.
var _ mesh.GossipData = &state{}

// Construct an empty state object, ready to receive updates.
// This is suitable to use at program start.
// Other peers will populate us with data.
func newState(self mesh.PeerName) *state {
	return &state{
		data: map[string]string{},
		self: self,
	}
}

func (st *state) get() map[string]string {
	st.mtx.RLock()
	defer st.mtx.RUnlock()
	// for _, v := range st.set {
	// 	for k, v := range st.set
	// 	result += v
	// }
	return st.data
}

func (st *state) add(data string) (complete *state) {
	st.mtx.Lock()
	defer st.mtx.Unlock()
	uuid := strconv.Itoa(int(st.self)) + "<-->" + time.Now().Format(time.RFC3339)
	st.data[uuid] = data
	return st
}

func (st *state) copy() *state {
	st.mtx.RLock()
	defer st.mtx.RUnlock()
	return &state{
		data: st.data,
	}
}

// Encode serializes our complete state to a slice of byte-slices.
// In this simple example, we use a single gob-encoded
// buffer: see https://golang.org/pkg/encoding/gob/
func (st *state) Encode() [][]byte {
	st.mtx.RLock()
	defer st.mtx.RUnlock()
	var buf bytes.Buffer
	if err := gob.NewEncoder(&buf).Encode(st.data); err != nil {
		panic(err)
	}
	return [][]byte{buf.Bytes()}
}

// Merge merges the other GossipData into this one,
// and returns our resulting, complete state.
func (st *state) Merge(other mesh.GossipData) (complete mesh.GossipData) {
	return st.mergeComplete(other.(*state).copy().data)
}

// Merge the set into our state, abiding increment-only semantics.
// Return a non-nil mesh.GossipData representation of the received set.
func (st *state) mergeReceived(set map[string]string) (received mesh.GossipData) {
	st.mtx.Lock()
	defer st.mtx.Unlock()

	for k, v := range set {
		st.data[k] = v
	}

	return st
}

// Merge the set into our state, abiding increment-only semantics.
// Return any key/values that have been mutated, or nil if nothing changed.
func (st *state) mergeDelta(set map[string]string) (delta mesh.GossipData) {
	st.mtx.Lock()
	defer st.mtx.Unlock()
	if len(set) <= 0 {
		return nil // per OnGossip requirements
	}
	for k, v := range set {
		st.data[k] = v
	}

	return st
}

// Merge the set into our state, abiding increment-only semantics.
// Return our resulting, complete state.
func (st *state) mergeComplete(set map[string]string) (complete mesh.GossipData) {
	st.mtx.Lock()
	defer st.mtx.Unlock()

	for k, v := range set {
		st.data[k] = v
	}

	return st
}
