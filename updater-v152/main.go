package main

import (
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "os/exec"
    "path/filepath"
    "strconv"
    "strings"
    "time"
)

const (
    appName = "MCU Tracker Ultimate"
    bootstrapManifest = "https://ovztur.github.io/bootstrap/latest.json"
    appManifest = "https://ovztur.github.io/app/latest.json"
)

type manifest struct { Version string `json:"version"`; URL string `json:"url"`; SHA256 string `json:"sha256"`; Notes string `json:"notes"` }
var client = &http.Client{Timeout: 30 * time.Second}

func main() {
    show("MCU Tracker v1.5.2", "İnternet bağlantılı güncelleme başlatılıyor.\n\nMevcut hesap, ilerleme, kupa, puan ve ayarlarınız korunacaktır.")
    bm, err := fetch(bootstrapManifest)
    if err != nil { show("MCU Tracker", "Güncelleme sunucusuna bağlanılamadı.\n\nİnternet bağlantınızı kontrol edip tekrar deneyin."); return }
    tmp := filepath.Join(os.TempDir(), "MCU_Tracker_Online_Bootstrap_"+safe(bm.Version)+".exe")
    _ = os.Remove(tmp)
    if err := download(bm.URL, tmp); err != nil { show("MCU Tracker", "İnternet bağlantılı uygulama indirilemedi.\n\nHata: "+err.Error()); return }
    if !verify(tmp, bm.SHA256) { _ = os.Remove(tmp); show("MCU Tracker", "Güvenlik kontrolü başarısız oldu: SHA-256 doğrulanamadı.\n\nKurulum iptal edildi."); return }
    target := installedExe(); _ = os.MkdirAll(filepath.Dir(target), 0755)
    _ = exec.Command("taskkill", "/F", "/IM", "MCU Tracker Ultimate.exe").Run(); time.Sleep(500*time.Millisecond)
    if _, err := os.Stat(target); err == nil { bak:=target+".pre-v1.5.2.bak"; _=os.Remove(bak); _=copyFile(target,bak) }
    if err := copyFile(tmp,target); err != nil { show("MCU Tracker", "Güncelleme dosyası kurulamadı.\n\nHata: "+err.Error()); return }
    _, _ = fetch(appManifest)
    if err := exec.Command(target, "--installed").Start(); err != nil { show("MCU Tracker", "Güncelleme kuruldu fakat uygulama otomatik açılamadı.\n\nMasaüstündeki MCU Tracker Ultimate kısayolunu açın."); return }
    show("MCU Tracker v1.5.2", "Güncelleme tamamlandı.\n\n✓ Admin Paneli / Ana Admin: ovztur\n✓ İnternet bağlantılı içerik güncellemesi\n✓ Otomatik sürüm kontrolü\n✓ SHA-256 doğrulaması\n✓ Mevcut kullanıcı verileri korunur\n\nBundan sonraki içerik güncellemeleri otomatik alınacaktır.")
}

func installedExe() string { b:=os.Getenv("LOCALAPPDATA"); if b=="" {b=os.TempDir()}; return filepath.Join(b,"Programs",appName,appName+".exe") }
func fetch(url string)(manifest,error){ var m manifest; req,_:=http.NewRequest("GET",url+"?t="+strconv.FormatInt(time.Now().Unix(),10),nil); req.Header.Set("Cache-Control","no-cache"); resp,err:=client.Do(req); if err!=nil{return m,err}; defer resp.Body.Close(); if resp.StatusCode<200||resp.StatusCode>=300{return m,fmt.Errorf("HTTP %d",resp.StatusCode)}; if err:=json.NewDecoder(resp.Body).Decode(&m);err!=nil{return m,err}; if m.Version==""||m.URL==""||m.SHA256==""{return m,fmt.Errorf("geçersiz manifest")}; return m,nil }
func download(url,dst string)error{sep:="?";if strings.Contains(url,"?"){sep="&"};req,_:=http.NewRequest("GET",url+sep+"t="+strconv.FormatInt(time.Now().Unix(),10),nil);resp,err:=client.Do(req);if err!=nil{return err};defer resp.Body.Close();if resp.StatusCode<200||resp.StatusCode>=300{return fmt.Errorf("HTTP %d",resp.StatusCode)};f,err:=os.Create(dst);if err!=nil{return err};_,cpErr:=io.Copy(f,resp.Body);closeErr:=f.Close();if cpErr!=nil{return cpErr};return closeErr}
func verify(path,want string)bool{f,err:=os.Open(path);if err!=nil{return false};defer f.Close();h:=sha256.New();if _,err:=io.Copy(h,f);err!=nil{return false};got:=hex.EncodeToString(h.Sum(nil));return strings.EqualFold(strings.TrimSpace(got),strings.TrimSpace(want))}
func copyFile(src,dst string)error{in,err:=os.Open(src);if err!=nil{return err};defer in.Close();out,err:=os.Create(dst);if err!=nil{return err};_,err=io.Copy(out,in);cerr:=out.Close();if err!=nil{return err};return cerr}
func safe(v string)string{return strings.NewReplacer("/","_","\\","_",":","_").Replace(v)}
func psq(s string)string{return strings.ReplaceAll(s,"'","''")}
func show(t,m string){script:=fmt.Sprintf(`Add-Type -AssemblyName PresentationFramework;[System.Windows.MessageBox]::Show('%s','%s')|Out-Null`,psq(m),psq(t));_=exec.Command("powershell.exe","-NoProfile","-ExecutionPolicy","Bypass","-Command",script).Run()}
