import os, argparse

class FengYun2_Corrector:
    def print_start(self) -> None:
        print("-----------------------------------------------------------------")
        print("                                                                 ")
        print("        FengYun-2 S-VISSR Counter + Sync Marker Corrector        ")
        print("                         by Egor UB1QBJ                          ")
        print("                                                                 ")
        print("-----------------------------------------------------------------")
        return

    def read_frame(self) -> bytes:
        if(data:=self.input_file.read(44356)):
            return data

    def write_frame(self, sync: int, data_block1: bytes, offset: int, data_block2: bytes) -> None:
        self.output_file.write(int(sync).to_bytes(7,'big'))
        self.output_file.write(data_block1)
        self.output_file.write(int(offset).to_bytes(2,'big'))
        self.output_file.write(data_block2)
        return

    def main(self) -> None:
        n=0
        for i in range(self.total_frames):
            data=self.read_frame()
            syncwordfile=data[:7]
            if (i<self.first_block):
                vcducounter=0x0000
                syncword=0x00000000000000
            if (i>=self.first_block<=self.sec_block):
                vcducounter=n
                n+=1
                syncword = 0x00000033FFFF00
            if (i>self.sec_block):
                vcducounter =0x0000
                syncword=0x000000CC000000
            if (i>=self.last):
                vcducounter=0x0000
                syncword=0x000000CC000000
            block1=data[7:67]
            block2=data[69:]
            self.write_frame(sync=syncword, data_block1=block1, data_block2=block2, offset=vcducounter)
            progress="%.0f" % float(i/self.one_p)
            print(f"Total lines: {self.total_frames} | Line:{i+1} | Frame Sync: 0x{hex(int.from_bytes(syncwordfile, 'big'))[2:].zfill(14).upper()} | New Frame Sync: 0x{hex(syncword)[2:].zfill(14).upper()} | Progress:{progress}%", end='\r')
        return

    def __init__(self, inputfile: str, outputfile: str) -> None:
        self.input_size=os.path.getsize(inputfile)
        self.input_file = open(inputfile,'rb')
        self.total_frames=int(self.input_size/44356)
        self.one_p=self.total_frames/100
        self.last=self.total_frames-int(self.one_p*11)
        self.first_block=int(self.one_p*3)
        self.sec_block=self.first_block+2501
        self.output_file = open(outputfile,'wb')
        self.syncword = 0x00000000000000
        self.print_start()
        self.main()
        self.input_file.close()
        self.output_file.close()
        pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--input", help="Input binary file name")
    parser.add_argument("-o", "--output", help="Output binary file name")
    inputfile = parser.parse_args().input
    outfile = parser.parse_args().output
    FengYun2_Corrector(inputfile=inputfile, outputfile=outfile)
    print('Done!')