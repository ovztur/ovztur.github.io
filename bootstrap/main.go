package main

import (
    _ "embed"
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "os/exec"
    "path/filepath"
    "runtime"
    "strconv"
    "strings"
    "time"
)

const (
    appName          = "MCU Tracker Ultimate"
    bootstrapVersion = "1.5.1"
    siteBase         = "https://ovztur.github.io"
    appManifestURL   = siteBase + "/app/latest.json"
    selfManifestURL  = siteBase + "/bootstrap/latest.json"
)

//go:embed MCU_Tracker_Logo.ico
var logoICO []byte

type manifest struct {
    Version string `json:"version"`
    URL     string `json:"url"`
    SHA256  string `json:"sha256"`
    Notes   string `json:"notes"`
}

var httpClient = &http.Client{Timeout: 15 * time.Second}

func main() {
    if runtime.GOOS != "windows" { return }
    args := os.Args[1:]
    if len(args) > 0 && args[0] == "--apply-update" { applyUpdate(args); return }

    exe, _ := os.Executable()
    exe, _ = filepath.Abs(exe)

    installed, ok := ensureInstalled(exe)
    if !ok { return }
    if !samePath(exe, installed) {
        _ = exec.Command(installed, "--installed").Start()
        return
    }
    exe = installed

    if len(args) > 0 && strings.HasPrefix(strings.ToLower(args[0]), "mcutracker://") {
        registerProtocol(exe)
        handleProtocol(exe, args[0])
        return
    }

    registerProtocol(exe)
    ensureIcon()
    shortcuts(exe)

    if checkSelfUpdate(exe) { return }

    dir := localDir()
    _ = os.MkdirAll(dir, 0755)
    syncContent(dir)
    html := filepath.Join(dir, "index.html")
    if _, err := os.Stat(html); err != nil {
        show("MCU Tracker", "Uygulama içeriği indirilemedi. İnternet bağlantınızı kontrol edin.")
        return
    }
    launch(html)
}

func localDir() string {
    b := os.Getenv("LOCALAPPDATA")
    if b == "" { b = os.TempDir() }
    return filepath.Join(b, appName)
}

func programExe() string {
    b := os.Getenv("LOCALAPPDATA")
    if b == "" { b = os.TempDir() }
    return filepath.Join(b, "Programs", appName, appName+".exe")
}

func ensureInstalled(current string) (string, bool) {
    target := programExe()
    if samePath(current, target) { return target, true }
    if err := os.MkdirAll(filepath.Dir(target), 0755); err != nil {
        show("MCU Tracker", "Kurulum klasörü oluşturulamadı.")
        return "", false
    }
    if _, err := os.Stat(target); err == nil { _ = os.Rename(target, target+".bak") }
    if err := copyFile(current, target); err != nil {
        show("MCU Tracker", "MCU Tracker kurulamadı. Uygulama açıksa kapatıp tekrar deneyin.")
        return "", false
    }
    ensureIcon()
    registerProtocol(target)
    shortcuts(target)
    return target, true
}

func ensureIcon() {
    p := filepath.Join(localDir(), "Assets", "MCU_Tracker_Logo.ico")
    _ = os.MkdirAll(filepath.Dir(p), 0755)
    if len(logoICO) > 0 { _ = os.WriteFile(p, logoICO, 0644) }
}

func syncContent(dir string) {
    m, err := fetchManifest(appManifestURL)
    if err != nil { return }
    html := filepath.Join(dir, "index.html")
    ver := filepath.Join(dir, "content.version")
    cur, _ := os.ReadFile(ver)
    if _, err := os.Stat(html); err == nil && strings.TrimSpace(string(cur)) == strings.TrimSpace(m.Version) { return }

    tmp := html + ".new"
    if err := download(m.URL, tmp); err != nil { return }
    if !verifySHA(tmp, m.SHA256) { _ = os.Remove(tmp); return }
    _ = os.Remove(html + ".old")
    if _, err := os.Stat(html); err == nil { _ = os.Rename(html, html+".old") }
    if err := os.Rename(tmp, html); err != nil { return }
    _ = os.WriteFile(ver, []byte(m.Version), 0644)
}

func checkSelfUpdate(exe string) bool {
    m, err := fetchManifest(selfManifestURL)
    if err != nil || !newer(m.Version, bootstrapVersion) { return false }
    tmp := filepath.Join(os.TempDir(), "MCU_Tracker_Update_"+safeVersion(m.Version)+".exe")
    if err := download(m.URL, tmp); err != nil { return false }
    if !verifySHA(tmp, m.SHA256) { _ = os.Remove(tmp); return false }
    cmd := exec.Command(tmp, "--apply-update", exe, strconv.Itoa(os.Getpid()))
    return cmd.Start() == nil
}

func fetchManifest(url string) (manifest, error) {
    var m manifest
    req, _ := http.NewRequest("GET", url+"?t="+strconv.FormatInt(time.Now().Unix(), 10), nil)
    req.Header.Set("Cache-Control", "no-cache")
    resp, err := httpClient.Do(req)
    if err != nil { return m, err }
    defer resp.Body.Close()
    if resp.StatusCode < 200 || resp.StatusCode >= 300 { return m, fmt.Errorf("http %d", resp.StatusCode) }
    err = json.NewDecoder(resp.Body).Decode(&m)
    if err != nil || m.Version == "" || m.URL == "" || m.SHA256 == "" { return m, fmt.Errorf("invalid manifest") }
    return m, nil
}

func download(url, out string) error {
    req, _ := http.NewRequest("GET", url+cacheSep(url)+"t="+strconv.FormatInt(time.Now().Unix(), 10), nil)
    resp, err := httpClient.Do(req)
    if err != nil { return err }
    defer resp.Body.Close()
    if resp.StatusCode < 200 || resp.StatusCode >= 300 { return fmt.Errorf("http %d", resp.StatusCode) }
    f, err := os.Create(out)
    if err != nil { return err }
    _, cpErr := io.Copy(f, resp.Body)
    closeErr := f.Close()
    if cpErr != nil { return cpErr }
    return closeErr
}

func cacheSep(u string) string { if strings.Contains(u, "?") { return "&" }; return "?" }

func verifySHA(path, want string) bool {
    f, err := os.Open(path); if err != nil { return false }
    defer f.Close()
    h := sha256.New(); if _, err := io.Copy(h, f); err != nil { return false }
    got := hex.EncodeToString(h.Sum(nil))
    return strings.EqualFold(strings.TrimSpace(got), strings.TrimSpace(want))
}

func newer(remote, local string) bool {
    r := versionParts(remote); l := versionParts(local)
    for i:=0;i<3;i++ { if r[i] != l[i] { return r[i] > l[i] } }
    return false
}
func versionParts(v string) [3]int {
    var out [3]int
    v = strings.TrimPrefix(strings.TrimSpace(v), "v")
    p := strings.Split(v, ".")
    for i:=0;i<3 && i<len(p);i++ { n,_ := strconv.Atoi(strings.TrimFunc(p[i], func(r rune) bool { return r<'0'||r>'9' })); out[i]=n }
    return out
}
func safeVersion(v string) string { return strings.NewReplacer("/","_","\\","_",":","_").Replace(v) }

func launch(html string) {
    browser := findBrowser()
    if browser == "" { show("MCU Tracker", "Microsoft Edge veya Google Chrome bulunamadı."); return }
    prof := filepath.Join(localDir(), "BrowserProfile")
    _ = os.MkdirAll(prof, 0755)
    u := "file:///" + strings.ReplaceAll(filepath.ToSlash(html), " ", "%20")
    _ = exec.Command(browser, "--app="+u, "--user-data-dir="+prof, "--no-first-run", "--disable-default-apps", "--window-size=1280,860").Start()
}

func findBrowser() string {
    c := []string{
        filepath.Join(os.Getenv("PROGRAMFILES(X86)"), "Microsoft", "Edge", "Application", "msedge.exe"),
        filepath.Join(os.Getenv("PROGRAMFILES"), "Microsoft", "Edge", "Application", "msedge.exe"),
        filepath.Join(os.Getenv("PROGRAMFILES"), "Google", "Chrome", "Application", "chrome.exe"),
        filepath.Join(os.Getenv("PROGRAMFILES(X86)"), "Google", "Chrome", "Application", "chrome.exe"),
    }
    for _, p := range c { if p!="" { if _,e:=os.Stat(p); e==nil { return p } } }
    return ""
}

func registerProtocol(exe string) {
    b := `HKCU\Software\Classes\mcutracker`
    rr("add", b, "/ve", "/d", "URL:MCU Tracker Protocol", "/f")
    rr("add", b, "/v", "URL Protocol", "/d", "", "/f")
    rr("add", b+`\shell\open\command`, "/ve", "/d", `"`+exe+`" "%1"`, "/f")
}
func rr(a ...string) { _ = exec.Command("reg", a...).Run() }

func handleProtocol(exe, raw string) {
    l := strings.ToLower(raw)
    switch {
    case strings.Contains(l, "create-shortcut"): shortcuts(exe)
    case strings.Contains(l, "open-data-folder"): _ = exec.Command("explorer.exe", localDir()).Start()
    }
}

func shortcuts(exe string) {
    ico := filepath.Join(localDir(), "Assets", "MCU_Tracker_Logo.ico")
    desk := filepath.Join(os.Getenv("USERPROFILE"), "Desktop", appName+".lnk")
    start := filepath.Join(os.Getenv("APPDATA"), "Microsoft", "Windows", "Start Menu", "Programs", appName+".lnk")
    s := fmt.Sprintf(`$w=New-Object -ComObject WScript.Shell;foreach($p in @('%s','%s')){$d=Split-Path $p;New-Item -ItemType Directory -Force -Path $d|Out-Null;$x=$w.CreateShortcut($p);$x.TargetPath='%s';$x.WorkingDirectory='%s';if(Test-Path '%s'){$x.IconLocation='%s,0'};$x.Description='MCU Tracker Ultimate';$x.Save()}`,
        psq(desk), psq(start), psq(exe), psq(filepath.Dir(exe)), psq(ico), psq(ico))
    _ = exec.Command("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", s).Run()
}

func applyUpdate(a []string) {
    if len(a) < 3 { return }
    target := a[1]
    pid, _ := strconv.Atoi(a[2])
    for i:=0; i<100 && exists(pid); i++ { time.Sleep(150*time.Millisecond) }
    self, _ := os.Executable()
    bak := target + ".bak"
    _ = os.Remove(bak)
    _ = os.Rename(target, bak)
    if err := copyFile(self, target); err != nil { _ = os.Rename(bak, target); return }
    _ = exec.Command(target, "--installed").Start()
}

func exists(pid int) bool {
    if pid <= 0 { return false }
    o, e := exec.Command("tasklist", "/FI", fmt.Sprintf("PID eq %d", pid), "/NH").Output()
    return e == nil && strings.Contains(string(o), strconv.Itoa(pid))
}

func copyFile(src, dst string) error {
    in, err := os.Open(src); if err != nil { return err }
    defer in.Close()
    out, err := os.Create(dst); if err != nil { return err }
    _, err = io.Copy(out, in)
    closeErr := out.Close()
    if err != nil { return err }
    return closeErr
}

func samePath(a,b string) bool {
    aa,_:=filepath.Abs(a); bb,_:=filepath.Abs(b)
    return strings.EqualFold(filepath.Clean(aa), filepath.Clean(bb))
}
func psq(s string) string { return strings.ReplaceAll(s, "'", "''") }
func show(t,m string) { _ = exec.Command("powershell.exe","-NoProfile","-Command",fmt.Sprintf(`Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::Show('%s','%s')|Out-Null`,psq(m),psq(t))).Run() }
