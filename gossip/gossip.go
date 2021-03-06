package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/hashicorp/memberlist"
	"github.com/pborman/uuid"
)

var (
	mtx         sync.RWMutex
	members     = flag.String("members", "", "comma seperated list of members")
	httpPort    = flag.Int("http", 8080, "http port")
	gossipPort  = flag.Int("gport", 6001, "gossip port")
	numberNodes = flag.Int("num", 16, "nodes by default")
	items       = map[string]string{}

	broadcasts *memberlist.TransmitLimitedQueue
)

type broadcast struct {
	msg    []byte
	notify chan<- struct{}
}

type delegate struct{}

type update struct {
	Action string // add, del
	Data   map[string]string
}

func init() {
	flag.Parse()
}

func (b *broadcast) Invalidates(other memberlist.Broadcast) bool {
	return false
}

func (b *broadcast) Message() []byte {
	return b.msg
}

func (b *broadcast) Finished() {
	if b.notify != nil {
		close(b.notify)
	}
}

func (d *delegate) NodeMeta(limit int) []byte {
	return []byte{}
}

func (d *delegate) NotifyMsg(b []byte) {
	if len(b) == 0 {
		return
	}

	switch b[0] {
	case 'd': // data
		var updates []*update
		if err := json.Unmarshal(b[1:], &updates); err != nil {
			return
		}
		mtx.Lock()
		for _, u := range updates {
			for k, v := range u.Data {
				items[k] = v
			}
		}
		mtx.Unlock()
	}
}

func (d *delegate) GetBroadcasts(overhead, limit int) [][]byte {
	return broadcasts.GetBroadcasts(overhead, limit)
}

func (d *delegate) LocalState(join bool) []byte {
	if len(items) == 0 {
		return nil
	}
	mtx.RLock()
	m := items
	mtx.RUnlock()
	b, _ := json.Marshal(m)
	return b
}

func (d *delegate) MergeRemoteState(buf []byte, join bool) {
	if len(buf) == 0 {
		return
	}
	if !join {
		return
	}
	var m map[string]string
	if err := json.Unmarshal(buf, &m); err != nil {
		return
	}
	mtx.Lock()
	for k, v := range m {
		items[k] = v
	}
	mtx.Unlock()
}
func handleRequests(w http.ResponseWriter, r *http.Request) {

	switch r.Method {
	case "GET":
		getHandler(w, r)
	case "POST":
		addHandler(w, r)
	}
}
func addHandler(w http.ResponseWriter, r *http.Request) {
	hostname, _ := os.Hostname()
	key := time.Now().Format(time.RFC850) + "<-->" + hostname
	body, error := ioutil.ReadAll(r.Body)
	if error != nil {
		panic(error)
	}
	val := string(body)
	mtx.Lock()
	items[key] = val
	mtx.Unlock()

	b, err := json.Marshal([]*update{
		&update{
			Action: "add",
			Data: map[string]string{
				key: val,
			},
		},
	})

	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	broadcasts.QueueBroadcast(&broadcast{
		msg:    append([]byte("d"), b...),
		notify: nil,
	})
	fmt.Println("post =>  ", items)

}

func getHandler(w http.ResponseWriter, r *http.Request) {
	mtx.RLock()
	items := items
	mtx.RUnlock()
	js, err := json.Marshal(items)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(js)
	fmt.Println("get =>  ", items)

}

func start() error {
	var num int = *numberNodes
	var parts []string
	hostname, _ := os.Hostname()
	c := memberlist.DefaultLocalConfig()
	c.Delegate = &delegate{}
	c.BindPort = *gossipPort
	c.Name = hostname + "-" + uuid.NewUUID().String()

	if len(*members) > 0 {
		parts = strings.Split(*members, ",")
		num = len(parts)
	}
	c.GossipNodes = num
	c.SuspicionMult = num
	c.RetransmitMult = num
	m, creation_err := memberlist.Create(c)
	if creation_err != nil {
		return creation_err
	}
	if len(parts) > 0 {
		_, err := m.Join(parts)
		if err != nil {
			return err
		}
	}

	node := m.LocalNode()
	fmt.Printf("Local member %s:%d\n", node.Addr, node.Port)
	broadcasts = &memberlist.TransmitLimitedQueue{
		NumNodes: func() int {
			return num
		},
		RetransmitMult: num,
	}
	return nil
}

func main() {
	if err := start(); err != nil {
		fmt.Println(err)
	}

	http.HandleFunc("/", handleRequests)
	fmt.Printf("Listening on :%d\n", *httpPort)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", *httpPort), nil); err != nil {
		fmt.Println(err)
	}
}
