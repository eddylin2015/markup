
傳送意見
Python
設定 Python 開發環境
本教學課程說明如何準備您的本機電腦以進行 Python 開發工作，其中包括開發在 Google Cloud Platform (GCP) 上執行的 Python 應用程式。

如果開發環境已設置好，請參閱 Python 和 GCP，大致瞭解如何在 GCP 上執行 Python 應用程式。

目標
安裝 Python 2 和 3 的最新版本。
安裝並使用 virtualenv。
安裝編輯器 (選用)。
安裝 Cloud SDK (選用)。
安裝 Python 適用的 Cloud 用戶端程式庫 (選用)。
安裝其他實用工具。
安裝 Python
Python 的安裝方式會因作業系統而異。請根據您在開發環境中使用的作業系統 (MacOS、Windows 或 Linux)，按照對應的指示進行操作。

MACOSWINDOWSLINUX
如要在 Windows 環境中安裝 Python 2 和 3，請從 Python 網站下載 Python 2 和 Python 3 最新版本的安裝程式。

安裝每個版本時，請務必為兩個版本選取 [Add Python to PATH] (將 Python 新增至 PATH) 選項。如果您沒有這樣做，則必須將 Python 的安裝目錄和 Scripts 資料夾新增到您的路徑，例如 C:\Python27\;C:\Python27\Scripts\。

安裝 Python 3 時，請務必安裝 Windows 適用的 Python 啟動器，這個啟動器預設為啟用。

如要存取您的 Python 版本，請使用 Windows 適用的 Python 啟動器。

如要啟動您安裝的 Python 最新版本，請執行下列指令：

py
如要啟動您安裝的 Python 2 最新版本，請執行下列指令：

py -2
如要啟動您安裝的 Python 3 最新版本，請執行下列指令：

py -3
如要確認 pip 版本可以使用，請執行下列指令：

pip --version
輸出畫面會顯示 C:\python27\lib\site-packages (Python 2.7.13) 中的版本。

pip 9.0.1
如要確認 pip3 可以使用，請執行下列指令：

pip3 --version
輸出畫面會顯示 C:\users\[USERNAME]\appdata\local\programs\python\python36-32\lib\site-packages (Python 3.6) 中的版本。

pip 9.0.1
您安裝的 Python 和 pip 版本可能高於此處顯示的版本。

安裝並使用 virtualenv 工具
virtualenv 工具可用來建立獨立的 Python 環境。這類獨立的環境可擁有單獨的 Python 套件版本，方便您把不同專案的依附元件區隔開來。建議您用 Python 在本機開發時，一律分別使用各專案的虛擬環境。

全域安裝 virtualenv。

MACOSWINDOWSLINUX
如要透過 Python 2 或 Python 3 安裝 pip，請使用 pip install --upgrade virtualenv。

安裝 virtualenv 之後，您就可以在專案中建立虛擬環境。virtualenv 會在 env 資料夾中建立整個 Python 安裝的虛擬副本。

MACOSWINDOWSLINUX
利用 --python 標記讓 virtualenv 知道該使用的 Python 版本：

cd your-project
virtualenv --python python3 env
您可能會需要指定完整的 Python 安裝目錄路徑：

virtualenv --python "c:\python36\python.exe" env
virtualenv --python "C:\Users\2002024\AppData\Local\Programs\Python\Python38\python.exe" env
副本建立之後，請根據以下指令啟用虛擬環境，將您的殼層設為使用 Python 的 virtualenv 路徑：

MACOSWINDOWSLINUX
.\env\Scripts\activate
現在您可以安裝套件，且不會影響其他專案或是全域 Python 安裝：

pip install google-cloud-storage
如果要中止使用虛擬環境並返回全域 Python，您可以直接停用：

deactivate
如要進一步瞭解 virtualenv，請參閱 Python 指南或 virtualenv 文件。

安裝編輯器
您需要編輯器，才能開發 Python 應用程式。以下列出幾個較為熱門的編輯器 (順序不代表熱門程度)：

Jon Skinner 的 Sublime Text
GitHub 的 Atom
JetBrains 的 PyCharm
安裝 Cloud SDK
Cloud SDK 是 Google Cloud Platform (GCP) 適用的一套工具，您可以使用這套工具所包含的 gcloud、gsutil 和 bq，透過指令列存取 Compute Engine、Cloud Storage、BigQuery 及其他產品和服務。您可以交互執行這些工具，或是在自動化指令碼中執行這些工具。

注意：Cloud SDK 是使用 Python 撰寫而成。無論您使用哪個 Python 版本開發應用程式，Cloud SDK 都需要搭配 Python 2.7.9 以上版本，但目前無法在 Python 3 中運作。此支援等級不會影響您的應用程式，即使您使用 Python 3 virtualenv，Cloud SDK 也能找到並使用您的 Python 2 安裝。
安裝 Python 適用的 Cloud 用戶端程式庫
JetBrains 的 Python 適用的 Cloud 用戶端程式庫是 Python 開發人員整合 GCP 服務 (如 Cloud Datastore 和 Cloud Storage) 所用的方式。如要安裝個別 API 的套件 (如 Cloud Storage)，請使用類似以下的指令：

pip install --upgrade google-cloud-storage
後續步驟
進一步瞭解 GCP 的 Python。
將 Python 應用程式部署至 App Engine。
參閱 GCP 產品說明文件。
本頁內容對您是否有任何幫助？請提供意見：



#!/usr/bin/env python
# -*- coding:utf-8 -
import redis
from flask import Flask, session
from flask_session import Session

app = Flask(__name__)
app.debug = True
app.secret_key = 'xxxx'

app.config['SESSION_TYPE'] = 'redis'  # session类型为redis
app.config['SESSION_PERMANENT'] = False  # 如果设置为True，则关闭浏览器session就失效。
app.config['SESSION_USE_SIGNER'] = False  # 是否对发送到浏览器上session的cookie值进行加密
app.config['SESSION_KEY_PREFIX'] = 'session:'  # 保存到session中的值的前缀
app.config['SESSION_REDIS'] = redis.Redis(host='127.0.0.1', port='6379', password='123123')  
# 用于连接redis的配置

Session(app)


@app.route('/index')
def index():
    session['k1'] = 'v1'
    return 'xx'

if __name__ == '__main__':
    app.run()

作者：马小跳_
链接：https://www.jianshu.com/p/805f33f096d6
來源：简书
简书著作权归作者所有，任何形式的转载都请联系作者获得授权并注明出处。

//////////
    //"@google-cloud/debug-agent": "^3.0.0",
    //"@google-cloud/logging-winston": "^0.10.1",
    //"@google-cloud/storage": "^2.0.3",
    //"@google-cloud/trace-agent": "^3.1.1",
